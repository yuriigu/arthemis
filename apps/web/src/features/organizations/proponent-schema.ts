export function validateProponent(value: { name: string; email: string }) {
  const errors: string[] = [];
  if (value.name.trim().length < 2) errors.push("Nome deve ter pelo menos 2 caracteres.");
  if (value.name.length > 150) errors.push("Nome muito longo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.push("E-mail inválido.");
  if (value.email.length > 150) errors.push("E-mail muito longo.");
  return errors;
}
