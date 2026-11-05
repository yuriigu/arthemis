export function validateUserLogin(value: { username: string; password: string }) {
  const errors: string[] = [];
  if (!value.username.trim() || value.username.length > 150) errors.push("Informe um usuário válido.");
  if (!value.password || value.password.length > 255) errors.push("Informe uma senha válida.");
  return errors;
}
