import { useMutation } from '@tanstack/react-query';

import { forgotPassword } from '../api/forgot-password';

/** Mutación de «Recupera tu contraseña». Expone `isPending` / `error`. */
export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword });
}
