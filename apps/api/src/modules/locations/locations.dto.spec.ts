import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

describe('Location DTO validation (ecosystemCode IUCN Level 3)', () => {
  const validProjectId = '20000000-0000-4000-8000-000000000001';

  it('aceita CreateLocationDto com ecosystemCode IUCN válido (ex.: T1.2)', async () => {
    const dto = plainToInstance(CreateLocationDto, {
      projectId: validProjectId,
      ecosystem: 'Floresta estacional',
      ecosystemCode: 'T1.2',
      country: 'Brasil',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita CreateLocationDto com ecosystemCode fora da lista IUCN', async () => {
    const dto = plainToInstance(CreateLocationDto, {
      projectId: validProjectId,
      ecosystemCode: 'INVALID_CODE',
    });

    const errors = await validate(dto);
    expect(errors.some((err) => err.property === 'ecosystemCode')).toBe(true);
  });

  it('rejeita UpdateLocationDto com ecosystemCode inválido', async () => {
    const dto = plainToInstance(UpdateLocationDto, {
      ecosystemCode: 'T99.9',
    });

    const errors = await validate(dto);
    expect(errors.some((err) => err.property === 'ecosystemCode')).toBe(true);
  });

  it('aceita UpdateLocationDto com ecosystemCode IUCN válido (ex.: MFT1.1)', async () => {
    const dto = plainToInstance(UpdateLocationDto, {
      ecosystemCode: 'MFT1.1',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
