import { IsDateString, IsInt, IsUUID, Min } from 'class-validator';

export class CreateMonitoringPeriodDto {
  @IsUUID()
  projectId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1900)
  yearT: number;
}