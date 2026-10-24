import { z } from 'zod';

const batchSchema = z.object({
  updated: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errorsCount: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  errorSamples: z.array(z.object({ gameId: z.string(), reason: z.string() })),
  nextCursor: z.string().uuid().nullable(),
  isSandbox: z.boolean(),
});

export type PriceUpdateBatch = z.infer<typeof batchSchema>;

export async function updateOutdatedPrices(
  accessToken: string,
  onProgress: (message: string) => void,
) {
  let cursor: string | null = null;
  let updated = 0;
  let skipped = 0;
  let errorsCount = 0;
  let total = 0;
  let isSandbox = false;
  const errorSamples: PriceUpdateBatch['errorSamples'] = [];

  do {
    const response = await fetch('/api/admin/update-outdated-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ cursor }),
    });
    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Réponse serveur non JSON (HTTP ${response.status}). La mise à jour a été interrompue après ${total} jeux traités. Les prix déjà enregistrés sont conservés. Vérifiez les logs de production (délai dépassé ou erreur de l'hébergeur).`,
      );
    }
    if (!response.ok) {
      const error = z.object({ error: z.string().optional(), message: z.string().optional() }).safeParse(data);
      throw new Error(error.success
        ? error.data.error || error.data.message || `Erreur serveur (HTTP ${response.status})`
        : `Erreur serveur (HTTP ${response.status})`);
    }
    const parsed = batchSchema.safeParse(data);
    if (!parsed.success) throw new Error('Réponse de mise à jour des prix invalide.');
    const batch = parsed.data;
    if (batch.nextCursor !== null && cursor !== null && batch.nextCursor <= cursor) {
      throw new Error('La mise à jour des prix ne progresse plus. Réessayez ultérieurement.');
    }
    updated += batch.updated;
    skipped += batch.skipped;
    errorsCount += batch.errorsCount;
    total += batch.total;
    isSandbox = batch.isSandbox;
    errorSamples.push(...batch.errorSamples.slice(0, 10 - errorSamples.length));
    cursor = batch.nextCursor;
    onProgress(`${total} jeux traités : ${updated} mis à jour, ${skipped} ignorés, ${errorsCount} erreurs.`);
  } while (cursor !== null);

  let message = total === 0
    ? 'Aucun jeu à mettre à jour (toutes les cotes ont moins de 7 jours).'
    : `Mise à jour terminée : ${updated} mis à jour, ${skipped} ignorés, ${errorsCount} erreurs sur ${total} jeux ciblés.`;
  if (isSandbox && skipped > 0 && updated === 0) {
    message += ' Note : En sandbox, eBay a peu de données de test. Passez en production pour obtenir des prix réels.';
  }
  if (errorSamples.length) {
    message += ` Erreurs : ${errorSamples.map(error => `${error.gameId} : ${error.reason}`).join(' ; ')}`;
  }
  return { success: errorsCount === 0, message };
}
