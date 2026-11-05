import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProjectDto {
  @IsUUID()
  @IsNotEmpty()
  proponentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsDateString()
  lifetimeStart?: string;

  @IsOptional()
  @IsDateString()
  lifetimeEnd?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sdgIds?: string[];
}
