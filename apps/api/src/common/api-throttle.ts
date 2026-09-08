/** Límite genérico para el resto de la API: solo frena bucles de abuso, no uso normal. */
export const API_THROTTLE = { default: { limit: 120, ttl: 60_000 } };
