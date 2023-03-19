import { Injectable } from '@nestjs/common';
import { readdirSync, statSync } from 'fs';
import { extname } from 'path';
import { CVInputDTO } from './dtos/body-input.input';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfExtract = require('pdf-extract');

type PDFPath = {
  pdf_path: string;
};

type PDFContext = PDFPath & {
  hash: string;
  text_pages: string[];
  single_page_pdf_file_paths: string[];
};

type PDFError = PDFPath & {
  error: string;
};

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

        const pdfContext = await this.getPdfContext(fullFilePath);

        if ('error' in pdfContext) {
          throw new Error(pdfContext.error);
        }

        const pdfText = pdfContext.text_pages;

        const result = input.tags.map((tag: string) => {
          const findRegex = new RegExp(tag.toLowerCase(), 'g');

          const matches = pdfText[0].toLowerCase().matchAll(findRegex);

          const noOfMatch = [...matches].length;

          return {
            tag,
            no_of_match: noOfMatch,
          };
        });

        return {
          filename: file,
          result,
        };
      }),
    );

    return filesContent.filter(Boolean);
  }

  getPdfContext(filePath: string): Promise<PDFContext | PDFError> {
    return new Promise((resolve, reject) => {
      const processor = pdfExtract(filePath, { type: 'text' }, (err) => {
        if (err) reject(err);
      });

      processor.on('complete', (data) => resolve(data));
      processor.on('error', (err) => reject(err));
    });
  }
}
