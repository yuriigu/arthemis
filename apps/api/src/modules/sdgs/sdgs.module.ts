import { Module } from '@nestjs/common';
import { SdgsService } from './sdgs.service';
import { SdgsController } from './sdgs.controller';

@Module({
  controllers: [SdgsController],
  providers: [SdgsService],
  exports: [SdgsService],
})
export class SdgsModule {}
