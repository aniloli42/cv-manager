import { Body, Controller, Post } from '@nestjs/common';
import { readdirSync, readFileSync, statSync } from 'fs';
import { extname } from 'path';
import { CvHandlerService } from './cv-handler.service';
import { CVInputDTO } from './dtos/body-input.input';

@Controller('cv')
export class CvHandlerController {
  constructor(private readonly cvHandlerService: CvHandlerService) {}

  @Post('')
  async uploadCV(@Body() input: CVInputDTO) {
    const files = readdirSync(input.filePath);

    const filesContent = files?.map((file) => {
      const fullFilePath = `${input.filePath}\/${file}`;

      const fileStat = statSync(fullFilePath);
      if (!fileStat.isFile()) return null;

      const fileExtension = extname(fullFilePath);

      if (fileExtension !== '.pdf') return null;

      const readContent = readFileSync(fullFilePath, { encoding: 'utf-8' });

      return readContent;
    });

    // console.log(filesContent);
    return { files, filesContent };
  }
}
