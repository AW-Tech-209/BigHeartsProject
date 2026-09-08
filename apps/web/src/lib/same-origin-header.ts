/** Marca las peticiones como propias: /auth/refresh y /auth/logout la exigen contra CSRF. */
export const SAME_ORIGIN_HEADER = { 'X-Requested-With': 'bighearts' };
