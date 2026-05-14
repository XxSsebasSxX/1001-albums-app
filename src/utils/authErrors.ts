import type { AuthError } from '@supabase/supabase-js';

export function handleSupabaseError(error: AuthError): string {
  switch (error.code) {
    case 'weak_password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'invalid_credentials':
      return 'Credenciales no válidas. Revisa tu email y contraseña.';
    case 'email_not_confirmed':
      return 'Por favor, confirma tu email antes de entrar.';
    case 'user_already_exists':
      return 'Este correo ya está registrado.';
    default:
      if (
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('fetch')
      ) {
        return 'Error de conexión. Revisa tu internet.';
      }
      return error.message || 'Ocurrió un error inesperado.';
  }
}
