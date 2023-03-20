import { Module } from '@nestjs/common';
import { CvHandlerService } from './cv-handler.service';
import { CvHandlerController } from './cv-handler.controller';

@Module({
  controllers: [CvHandlerController],
  providers: [CvHandlerService]
})
export class CvHandlerModule {}
