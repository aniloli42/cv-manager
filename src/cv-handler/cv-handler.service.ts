import { Injectable } from '@nestjs/common';
import { readdirSync, statSync } from 'fs';
import { extname } from 'path';
import { CVInputDTO } from './dtos/body-input.input';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfExtract = require('pdf-extract');

@Injectable()
export class CvHandlerService {
  async handleUploadCV(input: CVInputDTO) {
    const files = readdirSync(input.filePath);

    const filesContent = await Promise.all(
      files?.map(async (file) => {
        const fullFilePath = `${input.filePath}\/${file}`;

        const fileStat = statSync(fullFilePath);
        if (!fileStat.isFile()) return null;

        const fileExtension = extname(fullFilePath);
        if (fileExtension !== '.pdf') return null;

        return await this.getPdfContext(fullFilePath);
      }),
    );

    return { files, filesContent };
  }

  getPdfContext(filePath: string) {
    return new Promise((resolve, reject) => {
      const processor = pdfExtract(filePath, { type: 'text' }, (err) => {
        if (err) console.log(err.message);
      });

      processor.on('complete', (data) => resolve(data));
      processor.on('error', (err) => reject(err.message));
    });
  }
}
