import { ApiError } from './api-wrapper';

/**
 * Valide que le body contient tous les champs requis
 * Throw une ApiError si un champ est manquant
 * 
 * @example
 * const body = await request.json();
 * validateBody<{ endpoint: string; query: string }>(body, ['endpoint', 'query']);
 */
export function validateBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): asserts body is T {
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      throw new ApiError(
        `Le champ ${String(field)} est requis`,
        400
      );
    }
  }
}

/**
 * Valide qu'un paramètre existe
 * 
 * @example
 * validateParam(params, 'id');
 */
export function validateParam(
  params: any,
  field: string
): string {
  if (!params || !params[field]) {
    throw new ApiError(`Le paramètre ${field} est requis`, 400);
  }
  return params[field];
}

