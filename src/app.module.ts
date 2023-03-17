import { Module } from '@nestjs/common';
import { CvHandlerModule } from './cv-handler/cv-handler.module';
import { AppController } from './app.controller';

@Module({
  imports: [CvHandlerModule],
  controllers: [AppController],
})
export class AppModule {}
