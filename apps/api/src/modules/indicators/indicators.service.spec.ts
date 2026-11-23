import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Direction, IndicatorComponent } from '@arthemis/database';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { IndicatorsService } from './indicators.service';

describe('CreateIndicatorDto validation', () => {
  const basePayload = {
    activityId: '40000000-0000-4000-8000-000000000001',
    locationId: '30000000-0000-4000-8000-000000000001',
    name: 'Turbidez da água',
    component: IndicatorComponent.composition,
  };

  it('aceita um indicador válido com component obrigatório', async () => {
    const dto = plainToInstance(CreateIndicatorDto, {
      ...basePayload,
      direction: Direction.increases_with_condition,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('aceita decreases_with_condition quando threshold é informado', async () => {
    const dto = plainToInstance(CreateIndicatorDto, {
      ...basePayload,
      direction: Direction.decreases_with_condition,
      threshold: 15,
      referenceSource: 'CONAMA 357/2005',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita indicador sem component', async () => {
    const dto = plainToInstance(CreateIndicatorDto, {
      activityId: basePayload.activityId,
      name: basePayload.name,
    });

    const errors = await validate(dto);
    expect(errors.some((err) => err.property === 'component')).toBe(true);
  });

  it('rejeita decreases_with_condition sem threshold', async () => {
    const dto = plainToInstance(CreateIndicatorDto, {
      ...basePayload,
      direction: Direction.decreases_with_condition,
    });

    const errors = await validate(dto);
    expect(errors.some((err) => err.property === 'threshold')).toBe(true);
  });
});

describe('IndicatorsService', () => {
  const indicator = {
    createManyAndReturn: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const prisma = { indicator } as unknown as PrismaService;
  const service = new IndicatorsService(prisma);

  const validIndicatorDto: CreateIndicatorDto = {
    activityId: '40000000-0000-4000-8000-000000000001',
    locationId: '30000000-0000-4000-8000-000000000001',
    name: 'Turbidez da água',
    component: IndicatorComponent.composition,
    direction: Direction.decreases_with_condition,
    threshold: 15,
    referenceSource: 'CONAMA 357/2005',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('cria indicador válido com os novos campos', async () => {
      indicator.createManyAndReturn.mockResolvedValue([{ id: 'ind-1' }]);

      const result = await service.create([validIndicatorDto]);

      expect(result).toEqual(['ind-1']);
      expect(indicator.createManyAndReturn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({
              name: 'Turbidez da água',
              component: IndicatorComponent.composition,
              direction: Direction.decreases_with_condition,
              threshold: 15,
              referenceSource: 'CONAMA 357/2005',
            }),
          ],
        }),
      );
    });

    it('rejeita criação quando component está ausente', async () => {
      const invalidDto = {
        activityId: validIndicatorDto.activityId,
        name: 'Indicador sem componente',
      } as unknown as CreateIndicatorDto;

      await expect(service.create([invalidDto])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(indicator.createManyAndReturn).not.toHaveBeenCalled();
    });

    it('rejeita criação quando direction é decreases_with_condition sem threshold', async () => {
      const invalidDto: CreateIndicatorDto = {
        activityId: validIndicatorDto.activityId,
        name: 'Turbidez sem limiar',
        component: IndicatorComponent.composition,
        direction: Direction.decreases_with_condition,
      };

      await expect(service.create([invalidDto])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(indicator.createManyAndReturn).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejeita atualização para decreases_with_condition quando o indicador persistido não possui threshold', async () => {
      indicator.findUnique.mockResolvedValue({
        id: 'ind-1',
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        threshold: null,
      });

      const updateDto: UpdateIndicatorDto = {
        direction: Direction.decreases_with_condition,
      };

      await expect(service.update('ind-1', updateDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(indicator.update).not.toHaveBeenCalled();
    });

    it('rejeita atualização que remove o threshold de um indicador com decreases_with_condition', async () => {
      indicator.findUnique.mockResolvedValue({
        id: 'ind-1',
        component: IndicatorComponent.composition,
        direction: Direction.decreases_with_condition,
        threshold: 15,
      });

      const updateDto = {
        threshold: null,
      } as unknown as UpdateIndicatorDto;

      await expect(service.update('ind-1', updateDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(indicator.update).not.toHaveBeenCalled();
    });

    it('permite atualizar outros campos mantendo decreases_with_condition quando threshold já existe no banco', async () => {
      indicator.findUnique.mockResolvedValue({
        id: 'ind-1',
        component: IndicatorComponent.composition,
        direction: Direction.decreases_with_condition,
        threshold: 15,
      });
      indicator.update.mockResolvedValue({
        id: 'ind-1',
        name: 'Turbidez atualizada',
      });

      await service.update('ind-1', { name: 'Turbidez atualizada' });

      expect(indicator.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ind-1' },
          data: expect.objectContaining({ name: 'Turbidez atualizada' }),
        }),
      );
    });

    it('permite atualizar para decreases_with_condition quando threshold é enviado junto', async () => {
      indicator.findUnique.mockResolvedValue({
        id: 'ind-1',
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        threshold: null,
      });
      indicator.update.mockResolvedValue({
        id: 'ind-1',
        direction: Direction.decreases_with_condition,
        threshold: 10,
      });

      await service.update('ind-1', {
        direction: Direction.decreases_with_condition,
        threshold: 10,
      });

      expect(indicator.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ind-1' },
          data: expect.objectContaining({
            direction: Direction.decreases_with_condition,
            threshold: 10,
          }),
        }),
      );
    });

    it('lança NotFoundException quando o indicador não existe', async () => {
      indicator.findUnique.mockResolvedValue(null);

      await expect(
        service.update('inexistente', { name: 'Teste' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(indicator.update).not.toHaveBeenCalled();
    });
  });
});
