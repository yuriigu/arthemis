import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSdgDto {
  @IsNumber()
  @IsNotEmpty()
  number: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;
}
