import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'node:path'
import { AppController } from './app.controller'
import { CvHandlerModule } from './cv-handler/cv-handler.module'

@Module({
  imports: [
    CvHandlerModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/pdf'
    })
  ],
  controllers: [AppController]
})
export class AppModule {}
