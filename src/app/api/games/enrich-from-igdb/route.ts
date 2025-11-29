import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';
import { queryIGDB, IGDB_CONFIG, getIGDBGameName, getIGDBGameSummary } from '@/lib/igdb';
import { formatIGDBReleaseDate } from '@/lib/date-utils';
import { getIGDBImageUrl, translateTextWithStatus } from '@/lib/game-utils';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request, { supabase }) => {
  const body = await request.json();

  // Validation
  validateBody<{ query: string; platformId?: number; limit?: number }>(body, ['query']);

  const { query, platformId, limit = 50 } = body;

  if (typeof query !== 'string') {
    throw new ApiError('Le paramètre "query" doit être une chaîne de caractères', 400);
  }

    // Récupérer les jeux depuis IGDB
    const igdbQuery = `
      fields name, cover.image_id, first_release_date, summary, 
        involved_companies.company.name, involved_companies.developer, 
        involved_companies.publisher, platforms.id, platforms.name, genres.name,
        rating, total_rating, rating_count,
        alternative_names.name, alternative_names.comment;
      search "${query}";
      ${platformId ? `where platforms = (${platformId}) & version_parent = null;` : 'where version_parent = null;'}
      limit ${Math.min(limit, 100)};
    `;

    const igdbGames = await queryIGDB(IGDB_CONFIG.endpoints.games, igdbQuery);

    if (!Array.isArray(igdbGames) || igdbGames.length === 0) {
      return {
        success: true,
        added: 0,
        skipped: 0,
        message: 'Aucun jeu trouvé sur IGDB'
      };
    }

    // Récupérer toutes les consoles disponibles avec leur igdb_platform_id
    const { data: consoles, error: consolesError } = await supabase
      .from('consoles')
      .select('id, name, igdb_platform_id');

    if (consolesError) {
      console.error('Error fetching consoles:', consolesError);
      throw new ApiError('Erreur lors de la récupération des consoles', 500);
    }

    // Créer un map pour trouver rapidement la console par igdb_platform_id
    const consoleMap = new Map<number, { id: string; name: string }>();
    consoles?.forEach((console: { id: string; name: string; igdb_platform_id: number | null }) => {
      if (console.igdb_platform_id) {
        consoleMap.set(console.igdb_platform_id, { id: console.id, name: console.name });
      }
    });

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Traiter chaque jeu IGDB
    for (const igdbGame of igdbGames) {
      try {
        // Récupérer le développeur et l'éditeur
        const developer = igdbGame.involved_companies?.find((c: any) => c.developer)?.company?.name;
        const publisher = igdbGame.involved_companies?.find((c: any) => c.publisher)?.company?.name;

        // Pour chaque plateforme du jeu IGDB
        if (!igdbGame.platforms || !Array.isArray(igdbGame.platforms) || igdbGame.platforms.length === 0) {
          skipped++;
          continue;
        }

        for (const platform of igdbGame.platforms) {
          const platformId = platform.id;
          const consoleData = consoleMap.get(platformId);

          // Si la plateforme n'existe pas dans notre base, on skip
          if (!consoleData) {
            continue;
          }

          // Vérifier si le jeu existe déjà avec le même IGDB ID et console
          const { data: existingGame, error: findError } = await supabase
            .from('games')
            .select('id')
            .eq('igdb_id', igdbGame.id)
            .eq('console_id', consoleData.id)
            .maybeSingle();

          if (findError) {
            console.error(`Error checking game ${igdbGame.id}:`, findError);
            const gameName = getIGDBGameName(igdbGame);
            errors.push(`Erreur lors de la vérification du jeu ${gameName}`);
            continue;
          }

          // Si le jeu existe déjà, on skip
          if (existingGame) {
            skipped++;
            continue;
          }

          // Créer le jeu dans la base de données
          // S'assurer que release_date n'est jamais null
          const releaseDate = formatIGDBReleaseDate(igdbGame.first_release_date);
          
          // Extraire le nom (français si disponible via alternative_names, sinon anglais)
          // et la description (anglais uniquement)
          const gameName = getIGDBGameName(igdbGame);
          const gameSummary = getIGDBGameSummary(igdbGame);
          
          // Calculer la note moyenne IGDB (priorité : total_rating > rating)
          const averageRating = igdbGame.total_rating 
            ? Math.round(igdbGame.total_rating * 10) / 10  // Arrondir à 1 décimale
            : (igdbGame.rating ? Math.round(igdbGame.rating * 10) / 10 : null);
          
          // Traduire automatiquement la description en français
          let descriptionFr = null;
          if (gameSummary) {
            try {
              console.log(`🌐 Traduction automatique de "${gameName}"...`);
              const { translated, success } = await translateTextWithStatus(gameSummary, 'en', 'fr');
              if (success) {
                descriptionFr = translated;
                console.log(`✅ Traduction réussie pour "${gameName}"`);
              } else {
                console.log(`⚠️ Traduction échouée pour "${gameName}" - jeu ajouté sans traduction`);
              }
            } catch (error) {
              console.warn(`⚠️ Erreur traduction pour "${gameName}":`, error);
              // Continue sans traduction en cas d'erreur
            }
          }
          
          const { data: newGame, error: gameError } = await supabase
            .from('games')
            .insert({
              igdb_id: igdbGame.id,
              title: gameName,
              release_date: releaseDate || '2000-01-01', // Double sécurité
              developer: developer || 'Unknown',
              publisher: publisher || 'Unknown',
              description_en: gameSummary,
              description_fr: descriptionFr, // Traduction automatique ou null si échec
              cover_url: igdbGame.cover
                ? getIGDBImageUrl(igdbGame.cover.image_id, '720p')
                : null,
              console_id: consoleData.id,
              average_rating: averageRating
            })
            .select()
            .single();

          if (gameError) {
            console.error(`Error creating game ${gameName}:`, gameError);
            errors.push(`Erreur lors de la création du jeu ${gameName}: ${gameError.message}`);
            continue;
          }

          const gameId = newGame.id;

          // Ajouter les genres si le jeu en a
          if (igdbGame.genres && Array.isArray(igdbGame.genres) && igdbGame.genres.length > 0) {
            for (const genre of igdbGame.genres) {
              const genreName = genre.name;

              // Vérifier si le genre existe déjà
              const { data: existingGenre, error: genreQueryError } = await supabase
                .from('genres')
                .select('id')
                .eq('name', genreName)
                .maybeSingle();

              if (genreQueryError) {
                console.error(`Error checking genre ${genreName}:`, genreQueryError);
                continue;
              }

              let genreId;

              if (existingGenre) {
                genreId = existingGenre.id;
              } else {
                // Créer le genre s'il n'existe pas
                const { data: newGenre, error: genreInsertError } = await supabase
                  .from('genres')
                  .insert({ name: genreName })
                  .select()
                  .single();

                if (genreInsertError) {
                  console.error(`Error creating genre ${genreName}:`, genreInsertError);
                  continue;
                }
                genreId = newGenre.id;
              }

              // Créer la relation entre le jeu et le genre
              const { error: gameGenreError } = await supabase
                .from('game_genres')
                .insert({
                  game_id: gameId,
                  genre_id: genreId
                });

              // Ignorer les erreurs de duplication (code 23505)
              if (gameGenreError && gameGenreError.code !== '23505') {
                console.error(`Error linking genre ${genreName}:`, gameGenreError);
              }
            }
          }

          added++;
        }
      } catch (error: any) {
        const gameName = getIGDBGameName(igdbGame);
        console.error(`Error processing game ${gameName}:`, error);
        errors.push(`Erreur lors du traitement du jeu ${gameName}: ${error.message}`);
      }
    }

    return {
      success: true,
      added,
      skipped,
      total: igdbGames.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${added} jeu(x) ajouté(s) à la librairie, ${skipped} jeu(x) déjà présent(s)`
    };
});

