import { Controller, Get } from '@nestjs/common';
import { Socket } from 'socket.io';

@Controller('/')
export class AppController {
  @Get()
  greetUser() {
    return {
      message: 'Hi from CV Filtering System',
    };
  }


}
