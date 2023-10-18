import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { config } from '@/configs/env'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	await app.listen(config.port)
}
bootstrap()
