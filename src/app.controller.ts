import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class AppController {
  @Get()
  greetUser() {
    return {
      message: 'Hi from CV Filtering System',
    };
  }
}
