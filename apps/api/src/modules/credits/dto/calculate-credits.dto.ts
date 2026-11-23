import { IsNumber, Max, Min } from 'class-validator';

export class CalculateCreditsDto {
  @IsNumber()
  b: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  leakage: number;
}
