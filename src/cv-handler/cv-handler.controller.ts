import { Controller } from '@nestjs/common';
import { CvHandlerService } from './cv-handler.service';

@Controller('cv-handler')
export class CvHandlerController {
  constructor(private readonly cvHandlerService: CvHandlerService) {}
}
