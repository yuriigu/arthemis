export function validateUser(value: { proponent_id: string; username: string; email: string; password: string; role: string }) {
  const errors: string[] = [];
  if (!value.proponent_id) errors.push("Selecione uma organização válida.");
  if (!value.username.trim() || value.username.length > 150) errors.push("Informe um usuário válido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length > 150) errors.push("E-mail inválido.");
  if (value.password.length < 8 || value.password.length > 255) errors.push("A senha deve ter entre 8 e 255 caracteres.");
  if (!["admin", "manager", "visitor"].includes(value.role)) errors.push("Selecione um perfil válido.");
  return errors;
}
