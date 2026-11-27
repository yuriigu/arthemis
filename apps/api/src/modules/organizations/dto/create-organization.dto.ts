import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
