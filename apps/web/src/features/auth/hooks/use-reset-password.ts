import { useMutation } from '@tanstack/react-query';

import { resetPassword } from '../api/reset-password';

/** Mutación de «Crea una contraseña nueva». Expone `isPending` / `error`. */
export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
