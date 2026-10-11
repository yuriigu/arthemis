import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Expressão regular para validar o formato estrito de data civil YYYY-MM-DD.
 */
const CIVIL_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Quantidade de dias em cada mês em anos não bissextos (índices 1 a 12).
 */
const DAYS_IN_MONTH: readonly number[] = [
  0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];

/**
 * Verifica se um determinado ano é bissexto no calendário gregoriano.
 *
 * @param year Ano com 4 dígitos.
 * @returns Verdadeiro se o ano for bissexto.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Obtém a quantidade máxima de dias para um mês específico em determinado ano.
 *
 * @param year Ano da data civil.
 * @param month Mês (1..12).
 * @returns Quantidade máxima de dias válidos no mês.
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return DAYS_IN_MONTH[month] ?? 0;
}

/**
 * Valida se uma string representa uma data civil válida no formato YYYY-MM-DD.
 * Rejeita formatos com horário, separadores incorretos e datas inexistentes no calendário (ex: 2026-02-30).
 *
 * @param value Valor a ser validado.
 * @returns Verdadeiro se for uma data civil válida.
 */
export function isValidCivilDateString(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!CIVIL_DATE_REGEX.test(trimmed)) {
    return false;
  }

  const parts = trimmed.split('-');
  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10);
  const day = Number.parseInt(parts[2], 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }

  if (year < 1000 || year > 9999) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    return false;
  }

  return true;
}

/**
 * Converte uma string de data civil válida (YYYY-MM-DD) para um objeto Date em UTC meia-noite.
 * Essa conversão é compatível com colunas @db.Date do PostgreSQL, garantindo que nenhum
 * deslocamento de fuso horário altere o dia persistido.
 *
 * @param dateStr String no formato YYYY-MM-DD.
 * @returns Objeto Date configurado em 00:00:00 UTC.
 */
export function parseCivilDateToUtc(dateStr: string): Date {
  const parts = dateStr.trim().split('-');
  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10);
  const day = Number.parseInt(parts[2], 10);

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Formata um objeto Date ou string vindo do banco/ORM para o formato civil estrito YYYY-MM-DD.
 * Utiliza explicitamente os componentes UTC para evitar qualquer alteração de dia por fuso horário local.
 *
 * @param date Data vinda do banco ou entrada do usuário.
 * @returns String no formato YYYY-MM-DD ou null se o valor for nulo/indefinido.
 */
export function formatCivilDateToString(
  date: Date | string | null | undefined,
): string | null {
  if (!date) {
    return null;
  }

  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (CIVIL_DATE_REGEX.test(trimmed)) {
      return trimmed;
    }
    // Se for string ISO completa (ex: 2026-02-15T00:00:00.000Z), extrai via Date UTC
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getUTCFullYear();
      const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const day = String(parsed.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return null;
  }

  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Compara duas strings de data civil válidas (YYYY-MM-DD).
 *
 * @param dateStrA Primeira data civil.
 * @param dateStrB Segunda data civil.
 * @returns Número negativo se A < B, 0 se A == B, positivo se A > B.
 */
export function compareCivilDateStrings(
  dateStrA: string,
  dateStrB: string,
): number {
  return dateStrA.trim().localeCompare(dateStrB.trim());
}

/**
 * Validador class-validator para garantir datas civis válidas no formato YYYY-MM-DD.
 */
@ValidatorConstraint({ name: 'isCivilDate', async: false })
export class IsCivilDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isValidCivilDateString(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} deve ser uma data válida no formato YYYY-MM-DD (ex.: 2026-05-15)`;
  }
}

/**
 * Decorator para validar se o campo é uma data civil válida no formato YYYY-MM-DD.
 */
export function IsCivilDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCivilDateConstraint,
    });
  };
}

/**
 * Validador class-validator para verificar se uma data é maior ou igual a outro campo do mesmo objeto.
 */
@ValidatorConstraint({ name: 'isAfterOrEqualDateField', async: false })
export class IsAfterOrEqualDateFieldConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string' || !isValidCivilDateString(value)) {
      return false;
    }

    const [targetPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[
      targetPropertyName
    ];

    // Se o campo comparado não foi informado ou não é uma data válida, deixa a validação daquele campo falhar
    if (
      typeof relatedValue !== 'string' ||
      !isValidCivilDateString(relatedValue)
    ) {
      return true;
    }

    return compareCivilDateStrings(value, relatedValue) >= 0;
  }

  defaultMessage(args: ValidationArguments): string {
    const [targetPropertyName] = args.constraints as [string];
    return `${args.property} deve ser maior ou igual a ${targetPropertyName}`;
  }
}

/**
 * Decorator para validar que uma data final seja maior ou igual à data inicial de referência.
 */
export function IsAfterOrEqualDateField(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterOrEqualDateFieldConstraint,
    });
  };
}
