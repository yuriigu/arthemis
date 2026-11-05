import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddProponentDto {
  @IsUUID()
  @IsNotEmpty()
  proponentId: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}
