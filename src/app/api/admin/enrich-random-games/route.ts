import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';
import { queryIGDB, IGDB_CONFIG } from '@/lib/igdb';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

import { formatIGDBReleaseDate } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

// Mots-clés populaires pour récupérer des jeux variés et reconnus
const POPULAR_SEARCH_TERMS = [
  // Franchises AAA populaires Nintendo
  'zelda', 'mario', 'pokemon', 'super smash bros', 'mario kart', 'animal crossing',
  'splatoon', 'super mario', 'donkey kong', 'metroid', 'kirby', 'star fox',
  'luigi\'s mansion', 'pikmin', 'yoshi', 'fire emblem', 'xenoblade', 'bayonetta',
  
  // Franchises AAA PlayStation
  'god of war', 'uncharted', 'the last of us', 'horizon', 'spider-man',
  'ghost of tsushima', 'bloodborne', 'demons souls', 'death stranding',
  'ratchet and clank', 'infamous', 'littlebigplanet', 'killzone', 'the last guardian',
  
  // Franchises AAA Xbox
  'halo', 'gears of war', 'forza horizon', 'forza motorsport', 'fable',
  'crackdown', 'state of decay', 'ori', 'cuphead', 'sea of thieves',
  
  // Franchises AAA multiplateformes
  'call of duty', 'fifa', 'assassin\'s creed', 'elder scrolls', 'grand theft auto',
  'minecraft', 'fortnite', 'resident evil', 'metal gear', 'street fighter',
  'tekken', 'soul calibur', 'need for speed', 'gran turismo', 'nba 2k',
  'madden', 'nhl', 'tomb raider', 'batman arkham', 'witcher', 'skyrim',
  'fallout', 'bioshock', 'red dead redemption', 'cyberpunk 2077',
  'dark souls', 'elden ring', 'sekiro', 'monster hunter', 'persona',
  'kingdom hearts', 'dragon quest', 'final fantasy', 'devil may cry',
  
  // Jeux de combat populaires
  'mortal kombat', 'guilty gear', 'blazblue', 'king of fighters', 'dead or alive',
  'virtua fighter', 'super smash bros', 'injustice', 'marvel vs capcom',
  
  // Jeux de course populaires
  'forza', 'gran turismo', 'need for speed', 'mario kart', 'burnout',
  'dirt', 'grid', 'f1', 'project cars', 'assetto corsa',
  
  // Jeux de sport populaires
  'fifa', 'pro evolution soccer', 'pes', 'nba 2k', 'madden', 'nhl',
  'nfl', 'mlb the show', 'f1', 'moto gp', 'wwe 2k',
  
  // Jeux d'action-aventure populaires
  'uncharted', 'tomb raider', 'assassin\'s creed', 'batman arkham',
  'spider-man', 'god of war', 'devil may cry', 'bayonetta', 'nioh',
  
  // Jeux RPG populaires
  'final fantasy', 'dragon quest', 'persona', 'fire emblem', 'xenoblade',
  'tales of', 'star ocean', 'atelier', 'disgaea', 'trails of',
  'octopath traveler', 'bravely default', 'nier automata', 'nier replicant',
  
  // Jeux indies populaires
  'hollow knight', 'celeste', 'stardew valley', 'undertale', 'cuphead',
  'dead cells', 'hades', 'ori', 'crypt of the necrodancer', 'shovel knight',
  
  // Autres franchises populaires
  'superman', 'batman', 'injustice', 'marvel', 'dc', 'star wars',
  'harry potter', 'lord of the rings', 'game of thrones', 'the walking dead',
  'mass effect', 'dragon age', 'baldur\'s gate', 'divinity', 'pillars of eternity',
  
  // Jeux de stratégie populaires
  'civilization', 'age of empires', 'total war', 'xcom', 'company of heroes',
  'command and conquer', 'starcraft', 'warcraft', 'heroes of might and magic',
  
  // Jeux de simulation populaires
  'the sims', 'simcity', 'cities skylines', 'planet coaster', 'euro truck simulator',
  'flight simulator', 'farming simulator', 'two point hospital', 'rollercoaster tycoon',
  
  // Jeux multijoueur populaires
  'overwatch', 'valorant', 'apex legends', 'rainbow six', 'counter strike',
  'league of legends', 'dota', 'world of warcraft', 'destiny', 'borderlands',
  
  // Jeux de survie populaires
  'the forest', 'subnautica', 'ark survival', 'rust', 'don\'t starve',
  'terraria', 'starbound', 'valheim', 'v rising', 'grounded',
  
  // Jeux de puzzle populaires
  'portal', 'the witness', 'braid', 'limbo', 'inside', 'fez',
  'tetris', 'puyo puyo', 'lumines', 'picross', 'sudoku',
  
  // Jeux platformer populaires
  'crash bandicoot', 'spyro', 'banjo kazooie', 'rayman', 'littlebigplanet',
  'a hat in time', 'super meat boy', 'celeste', 'hollow knight',
  
  // Jeux horreur populaires
  'silent hill', 'fatal frame', 'dead space', 'the evil within', 'outlast',
  'amnesia', 'phasmophobia', 'until dawn', 'the quarry', 'alan wake',
  
  // Jeux rétro/remasters populaires
  'crash bandicoot n sane trilogy', 'spyro reignited', 'resident evil remake',
  'final fantasy remake', 'kingdom hearts hd', 'mega man', 'sonic',
  'castlevania', 'contra', 'double dragon', 'street of rage',
  
  // Licences et franchises supplémentaires
  'diablo', 'warcraft', 'starcraft', 'overwatch', 'world of warcraft',
  'call of duty modern warfare', 'call of duty black ops', 'battlefield',
  'farcry', 'watch dogs', 'splinter cell', 'ghost recon', 'rainbow six siege',
  'dead or alive', 'virtua fighter', 'blazblue', 'guilty gear', 'king of fighters',
  'tekken', 'mortal kombat', 'injustice', 'street fighter', 'king of fighters',
  'gran turismo', 'forza motorsport', 'forza horizon', 'need for speed',
  'grid', 'dirt', 'f1', 'moto gp', 'wrc', 'project cars',
  'fifa', 'pes', 'pro evolution soccer', 'nba 2k', 'madden', 'nhl',
  'wwe 2k', 'ufc', 'mario tennis', 'mario golf', 'mario party',
  'sonic the hedgehog', 'crash bandicoot', 'spyro the dragon',
  'ratchet and clank', 'jak and daxter', 'sly cooper', 'medievil',
  'shadow of the colossus', 'ico', 'the last guardian', 'bloodborne',
  'demons souls', 'nioh', 'nioh 2', 'sekiro', 'dark souls', 'elden ring',
  'god of war', 'horizon zero dawn', 'horizon forbidden west',
  'spider-man', 'spider-man miles morales', 'batman arkham',
  'the witcher', 'cyberpunk 2077', 'red dead redemption',
  'grand theft auto', 'assassin\'s creed', 'watch dogs',
  'mass effect', 'dragon age', 'baldur\'s gate', 'divinity',
  'pillars of eternity', 'pathfinder', 'neverwinter nights',
  'elder scrolls', 'fallout', 'the outer worlds', 'starfield',
  'bioshock', 'borderlands', 'destiny', 'destiny 2',
  'halo', 'gears of war', 'fable', 'forza', 'sea of thieves',
  'grounded', 'ori', 'cuphead', 'psychonauts',
  'resident evil', 'silent hill', 'dead space', 'the evil within',
  'outlast', 'amnesia', 'phasmophobia', 'until dawn', 'the quarry',
  'alan wake', 'control', 'quantum break', 'max payne',
  'monster hunter', 'dauntless', 'god eater', 'toukiden',
  'persona', 'shin megami tensei', 'dragon quest', 'final fantasy',
  'tales of', 'star ocean', 'atelier', 'disgaea', 'trails of',
  'xenoblade', 'fire emblem', 'octopath traveler', 'bravely default',
  'nier automata', 'nier replicant', 'drakengard',
  'super mario', 'the legend of zelda', 'pokemon', 'metroid',
  'kirby', 'donkey kong', 'star fox', 'f-zero', 'pikmin',
  'luigi\'s mansion', 'yoshi', 'wario', 'mario kart',
  'super smash bros', 'animal crossing', 'splatoon',
  'mario party', 'mario tennis', 'mario golf', 'mario strikers',
  'mario rabbids', 'paper mario', 'mario and luigi',
  'soul calibur', 'dead or alive', 'virtua fighter', 'blazblue',
  'guilty gear', 'king of fighters', 'samurai shodown',
  'the king of fighters', 'garou mark of the wolves',
  'marvel vs capcom', 'injustice', 'mortal kombat',
  'overwatch', 'valorant', 'apex legends', 'rainbow six',
  'counter strike', 'team fortress', 'left 4 dead',
  'borderlands', 'destiny', 'warframe', 'the division',
  'anthem', 'outriders', 'remnant', 'back 4 blood',
  'league of legends', 'dota', 'heroes of the storm',
  'smite', 'paladins', 'battleborn',
  'civilization', 'age of empires', 'total war', 'xcom',
  'company of heroes', 'command and conquer', 'starcraft',
  'warcraft', 'heroes of might and magic', 'endless legend',
  'the sims', 'simcity', 'cities skylines', 'planet coaster',
  'euro truck simulator', 'flight simulator', 'farming simulator',
  'two point hospital', 'rollercoaster tycoon', 'theme hospital',
  'planet zoo', 'jurassic world evolution', 'surviving mars',
  'the forest', 'subnautica', 'ark survival', 'rust',
  'don\'t starve', 'terraria', 'starbound', 'valheim',
  'v rising', 'grounded', 'raft', 'green hell',
  'portal', 'the witness', 'braid', 'limbo', 'inside',
  'fez', 'tetris', 'puyo puyo', 'lumines', 'picross',
  'the talos principle', 'the room', 'monument valley',
  'banjo kazooie', 'rayman', 'littlebigplanet', 'a hat in time',
  'crash bandicoot', 'spyro', 'super meat boy', 'celeste',
  'hollow knight', 'ori', 'shovel knight', 'mega man',
  'castlevania', 'contra', 'double dragon', 'street of rage',
  'sonic', 'streets of rage', 'shinobi', 'ninja gaiden',
  'superman', 'batman', 'spider-man', 'wolverine',
  'x-men', 'marvel', 'dc', 'injustice', 'marvel vs capcom',
  'star wars', 'jedi fallen order', 'battlefront', 'kotor',
  'lego star wars', 'lego batman', 'lego harry potter',
  'harry potter', 'lord of the rings', 'game of thrones',
  'the walking dead', 'telltale', 'life is strange',
  'heavy rain', 'detroit become human', 'beyond two souls',
  'quantum break', 'alan wake', 'control', 'max payne'
];

export const POST = withApi(async (request, { user, supabase }) => {
    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
    }

    const body = await request.json();
    const { targetCount = 500 } = body;

    // Récupérer toutes les consoles disponibles avec leur igdb_platform_id
    const { data: consoles, error: consolesError } = await supabaseAdmin
      .from('consoles')
      .select('id, name, igdb_platform_id');

    if (consolesError) {
      console.error('Error fetching consoles:', consolesError);
      throw new ApiError('Erreur lors de la récupération des consoles', 500);
    }

    if (!consoles || consoles.length === 0) {
      throw new ApiError('Aucune console trouvée dans la base de données', 400);
    }

    // Créer un map pour trouver rapidement la console par igdb_platform_id
    const consoleMap = new Map<number, { id: string; name: string }>();
    consoles.forEach(console => {
      if (console.igdb_platform_id) {
        consoleMap.set(console.igdb_platform_id, { id: console.id, name: console.name });
      }
    });

    let totalAdded = 0;
    let totalSkipped = 0;
    const errors: string[] = [];
    const processedGameIds = new Set<number>();

    // Mélanger les termes de recherche pour plus de variété
    const shuffledTerms = [...POPULAR_SEARCH_TERMS].sort(() => Math.random() - 0.5);

    // Traiter plusieurs recherches pour atteindre le nombre cible
    for (const searchTerm of shuffledTerms) {
      if (totalAdded >= targetCount) {
        break;
      }

      try {
        // Récupérer des jeux populaires depuis IGDB
        // Trier par rating pour obtenir les jeux les plus populaires
        // Utiliser des filtres moins stricts pour avoir plus de résultats
        const igdbQuery = `
          fields name, cover.image_id, first_release_date, summary, 
            involved_companies.company.name, involved_companies.developer, 
            involved_companies.publisher, platforms.id, platforms.name, genres.name,
            rating, total_rating, rating_count;
          search "${searchTerm}";
          where version_parent = null & (rating_count > 5 | rating > 40);
          sort rating desc;
          limit 50;
        `;

        const igdbGames = await queryIGDB(IGDB_CONFIG.endpoints.games, igdbQuery);

        if (!Array.isArray(igdbGames) || igdbGames.length === 0) {
          console.log(`Aucun résultat pour le terme "${searchTerm}"`);
          continue;
        }

        console.log(`Trouvé ${igdbGames.length} jeux pour "${searchTerm}"`);

        // Traiter chaque jeu IGDB
        for (const igdbGame of igdbGames) {
          if (totalAdded >= targetCount) {
            break;
          }

          // Éviter les doublons IGDB
          if (processedGameIds.has(igdbGame.id)) {
            continue;
          }

          try {
            // Récupérer le développeur et l'éditeur
            const developer = igdbGame.involved_companies?.find((c: any) => c.developer)?.company?.name;
            const publisher = igdbGame.involved_companies?.find((c: any) => c.publisher)?.company?.name;

            // Pour chaque plateforme du jeu IGDB
            if (!igdbGame.platforms || !Array.isArray(igdbGame.platforms) || igdbGame.platforms.length === 0) {
              totalSkipped++;
              continue;
            }

            // Essayer toutes les plateformes disponibles pour maximiser les ajouts
            let gameAdded = false;
            let platformsProcessed = 0;
            
            for (const platform of igdbGame.platforms) {
              if (!consoleMap.has(platform.id)) {
                continue;
              }

              const platformId = platform.id;
              const consoleData = consoleMap.get(platformId);

              if (!consoleData) {
                continue;
              }

              platformsProcessed++;

              // Vérifier si le jeu existe déjà avec le même IGDB ID et console
              const { data: existingGame, error: findError } = await supabaseAdmin
                .from('games')
                .select('id')
                .eq('igdb_id', igdbGame.id)
                .eq('console_id', consoleData.id)
                .maybeSingle();

              if (findError) {
                console.error(`Error checking game ${igdbGame.id} for ${consoleData.name}:`, findError);
                continue;
              }

              // Si le jeu existe déjà pour cette console, passer à la suivante
              if (existingGame) {
                continue;
              }

              // Créer le jeu dans la base de données
              // S'assurer que release_date n'est jamais null
              const releaseDate = formatIGDBReleaseDate(igdbGame.first_release_date);
              
              const { data: newGame, error: gameError } = await supabaseAdmin
                .from('games')
                .insert({
                  igdb_id: igdbGame.id,
                  title: igdbGame.name,
                  release_date: releaseDate || '2000-01-01', // Double sécurité
                  developer: developer || 'Unknown',
                  publisher: publisher || 'Unknown',
                  description: igdbGame.summary || '',
                  cover_url: igdbGame.cover
                    ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${igdbGame.cover.image_id}.jpg`
                    : null,
                  console_id: consoleData.id
                })
                .select()
                .single();

              if (gameError) {
                console.error(`Error creating game ${igdbGame.name} for ${consoleData.name}:`, gameError);
                errors.push(`Erreur lors de la création du jeu ${igdbGame.name} pour ${consoleData.name}: ${gameError.message}`);
                continue;
              }

              const gameId = newGame.id;

              // Ajouter les genres si le jeu en a (seulement la première fois pour éviter les doublons)
              if (!gameAdded && igdbGame.genres && Array.isArray(igdbGame.genres) && igdbGame.genres.length > 0) {
                for (const genre of igdbGame.genres) {
                  const genreName = genre.name;

                  // Vérifier si le genre existe déjà
                  const { data: existingGenre, error: genreQueryError } = await supabaseAdmin
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
                    const { data: newGenre, error: genreInsertError } = await supabaseAdmin
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
                  const { error: gameGenreError } = await supabaseAdmin
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

              totalAdded++;
              gameAdded = true;
              console.log(`✓ Ajouté: ${igdbGame.name} (${consoleData.name})`);
              // Continuer à traiter les autres plateformes pour ajouter le jeu sur toutes les plateformes disponibles
            }

            if (!gameAdded) {
              if (platformsProcessed === 0) {
                console.log(`⚠ ${igdbGame.name}: Aucune plateforme correspondante trouvée`);
              } else {
                console.log(`⚠ ${igdbGame.name}: Déjà présent sur toutes les plateformes disponibles`);
              }
              totalSkipped++;
            }
            processedGameIds.add(igdbGame.id);
          } catch (error: any) {
            console.error(`Error processing game ${igdbGame.name}:`, error);
            errors.push(`Erreur lors du traitement du jeu ${igdbGame.name}: ${error.message}`);
          }
        }
      } catch (error: any) {
        console.error(`Error processing search term ${searchTerm}:`, error);
        errors.push(`Erreur lors de la recherche "${searchTerm}": ${error.message}`);
      }
    }

    return {
      success: true,
      added: totalAdded,
      skipped: totalSkipped,
      target: targetCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limiter les erreurs affichées
      message: `${totalAdded} jeu(x) ajouté(s) à la librairie, ${totalSkipped} jeu(x) déjà présent(s)`
    };
});

