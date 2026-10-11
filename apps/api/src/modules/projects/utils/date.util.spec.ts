import { validate } from 'class-validator';
import {
  compareCivilDateStrings,
  formatCivilDateToString,
  isLeapYear,
  isValidCivilDateString,
  parseCivilDateToUtc,
  IsCivilDate,
  IsAfterOrEqualDateField,
} from './date.util.js';

class DummyDateDto {
  @IsCivilDate()
  startDate!: string;

  @IsCivilDate()
  @IsAfterOrEqualDateField('startDate')
  endDate!: string;
}

describe('date.util', () => {
  describe('isLeapYear', () => {
    it('identifica corretamente anos bissextos e não bissextos', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
    });
  });

  describe('isValidCivilDateString', () => {
    it('aceita datas válidas no formato YYYY-MM-DD', () => {
      expect(isValidCivilDateString('2026-01-01')).toBe(true);
      expect(isValidCivilDateString('2026-02-28')).toBe(true);
      expect(isValidCivilDateString('2024-02-29')).toBe(true); // ano bissexto
      expect(isValidCivilDateString('2026-12-31')).toBe(true);
    });

    it('rejeita datas inexistentes no calendário', () => {
      expect(isValidCivilDateString('2026-02-29')).toBe(false); // 2026 não é bissexto
      expect(isValidCivilDateString('2026-02-30')).toBe(false);
      expect(isValidCivilDateString('2026-04-31')).toBe(false); // abril tem 30 dias
      expect(isValidCivilDateString('2026-06-31')).toBe(false); // junho tem 30 dias
      expect(isValidCivilDateString('2026-11-31')).toBe(false); // novembro tem 30 dias
      expect(isValidCivilDateString('2026-13-01')).toBe(false); // mês 13 não existe
      expect(isValidCivilDateString('2026-00-10')).toBe(false); // mês 0 não existe
      expect(isValidCivilDateString('2026-05-00')).toBe(false); // dia 0 não existe
    });

    it('rejeita formatos que não sejam YYYY-MM-DD estrito', () => {
      expect(isValidCivilDateString('2026/02/15')).toBe(false);
      expect(isValidCivilDateString('15-02-2026')).toBe(false);
      expect(isValidCivilDateString('2026-2-5')).toBe(false);
      expect(isValidCivilDateString('2026-02-15T00:00:00Z')).toBe(false);
      expect(isValidCivilDateString('')).toBe(false);
      expect(isValidCivilDateString(null)).toBe(false);
      expect(isValidCivilDateString(undefined)).toBe(false);
      expect(isValidCivilDateString(20260215)).toBe(false);
    });
  });

  describe('parseCivilDateToUtc', () => {
    it('converte string YYYY-MM-DD para objeto Date em UTC meia-noite', () => {
      const date = parseCivilDateToUtc('2026-05-15');

      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(4); // 0-indexed maio
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(0);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
    });
  });

  describe('formatCivilDateToString', () => {
    it('formata Date mantendo o dia civil original em UTC', () => {
      const date = new Date(Date.UTC(2026, 4, 15, 0, 0, 0, 0));
      expect(formatCivilDateToString(date)).toBe('2026-05-15');
    });

    it('retorna a própria string quando já estiver no formato civil', () => {
      expect(formatCivilDateToString('2026-05-15')).toBe('2026-05-15');
    });

    it('retorna null para valores nulos ou inválidos', () => {
      expect(formatCivilDateToString(null)).toBeNull();
      expect(formatCivilDateToString(undefined)).toBeNull();
      expect(formatCivilDateToString(new Date('invalida'))).toBeNull();
    });
  });

  describe('compareCivilDateStrings', () => {
    it('compara cronologicamente duas datas civis', () => {
      expect(compareCivilDateStrings('2026-01-01', '2026-01-02')).toBeLessThan(0);
      expect(compareCivilDateStrings('2026-01-02', '2026-01-01')).toBeGreaterThan(0);
      expect(compareCivilDateStrings('2026-01-01', '2026-01-01')).toBe(0);
    });
  });

  describe('decorators de validação', () => {
    it('aprova DTO com datas civis válidas e data final posterior', async () => {
      const dto = new DummyDateDto();
      dto.startDate = '2026-03-01';
      dto.endDate = '2026-03-15';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('aprova DTO quando data final for igual à data inicial', async () => {
      const dto = new DummyDateDto();
      dto.startDate = '2026-03-01';
      dto.endDate = '2026-03-01';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejeita DTO com formato inválido ou data inexistente', async () => {
      const dto = new DummyDateDto();
      dto.startDate = '2026-02-30'; // inexistente
      dto.endDate = '2026-03-15';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('startDate');
    });

    it('rejeita DTO quando a data final for anterior à data inicial', async () => {
      const dto = new DummyDateDto();
      dto.startDate = '2026-06-01';
      dto.endDate = '2026-05-31'; // anterior

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('endDate');
    });
  });
});
