import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindObservationsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
