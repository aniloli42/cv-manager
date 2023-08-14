import { Module } from '@nestjs/common';
import { CvHandlerController } from './cv-handler.controller';
import { CvHandlerService } from './cv-handler.service';

@Module({
  controllers: [CvHandlerController],
  providers: [CvHandlerService]
})
export class CvHandlerModule { }
