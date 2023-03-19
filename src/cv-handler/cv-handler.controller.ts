import { Body, Controller, Post } from '@nestjs/common';
import { CvHandlerService } from './cv-handler.service';
import { CVInputDTO } from './dtos/body-input.input';

@Controller('cv')
export class CvHandlerController {
  constructor(private readonly cvHandlerService: CvHandlerService) {}

  @Post()
  async uploadCV(@Body() input: CVInputDTO) {
    try {
      return await this.cvHandlerService.handleUploadCV(input);
    } catch (error) {
      return error;
    }
  }
}
