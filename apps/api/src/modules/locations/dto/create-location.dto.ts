import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Prisma } from '@arthemis/database';

export class CreateLocationDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsString()
  ecosystem?: string;

  @IsOptional()
  @IsNumber()
  extent?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsObject() // JSONB no banco
  position?: Prisma.InputJsonValue;
}
