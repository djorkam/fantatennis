export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;

export function validatePassword(pw: string): string | null {
  if (pw.length < 8)              return 'At least 8 characters required';
  if (!/[A-Z]/.test(pw))         return 'At least one uppercase letter required';
  if (!/[0-9]/.test(pw))         return 'At least one number required';
  if (!/[!@#$%^&*]/.test(pw))    return 'At least one special character required (!@#$%^&*)';
  return null;
}
