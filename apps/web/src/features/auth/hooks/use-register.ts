import { useMutation } from '@tanstack/react-query';

import { registerUser } from '../api/register';

/** Mutación de registro. Expone isPending/isError y el usuario creado en `data`. */
export function useRegister() {
  return useMutation({ mutationFn: registerUser });
}
