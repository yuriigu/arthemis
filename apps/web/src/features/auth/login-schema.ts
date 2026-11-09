export function validateUserLogin(value: { email: string; password: string }) {
  const errors: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length > 150) {
    errors.push("Informe um e-mail válido.");
  }
  if (!value.password || value.password.length > 255) errors.push("Informe uma senha válida.");
  return errors;
}
