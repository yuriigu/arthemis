export function validateProponent(value: { name?: string; email?: string }) {
  const errors: string[] = [];
  if (value.name && value.name.trim().length < 2) errors.push("Nome deve ter pelo menos 2 caracteres.");
  if (value.name && value.name.length > 150) errors.push("Nome muito longo.");
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.push("E-mail inválido.");
  if (value.email && value.email.length > 150) errors.push("E-mail muito longo.");
  return errors;
}
