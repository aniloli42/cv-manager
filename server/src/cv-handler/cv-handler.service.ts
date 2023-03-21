import { Injectable } from '@nestjs/common';
import { readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import { env } from 'src/common/env.config';
import { CVInputDTO } from './dtos/body-input.input';

const STATIC_FILE = join(__dirname, '..', '..', 'uploads');

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
  async handleCVMatching(input: CVInputDTO) {
    const isFile = this.verifyFile(STATIC_FILE);

    if (isFile) {
      const isPDFFile = this.verifyPDFFile(STATIC_FILE);
      if (!isPDFFile) throw new Error(`Select PDF file`);

      const pdfContext = await this.getPdfContext(STATIC_FILE);

      if ('error' in pdfContext) throw new Error(`Unable to read pdf`);
      const pdfText = pdfContext.text_pages;

      const result = this.matchTagsWithFile(input.tags, pdfText[0]);

      return { file: STATIC_FILE, result };
    }

    const files = this.getFileList(STATIC_FILE);

    const filesContent = await Promise.all(
      files?.map(async (file) => {
        const filePath = `${STATIC_FILE}\/${file}`;

        const isFile = this.verifyFile(filePath);
        if (!isFile) return null;

        const isPDFFile = this.verifyPDFFile(filePath);
        if (!isPDFFile) return null;

        const pdfContext = await this.getPdfContext(filePath).catch(
          (err): PDFError => {
            return err;
          },
        );

        if ('error' in pdfContext)
          return {
            ...pdfContext,
            file: ` ${env.SERVER_ROOT}/pdf/${pdfContext.pdf_path
              .split('/')
              .at(-1)}`,
          };
        const pdfText = pdfContext.text_pages;

        const result = this.matchTagsWithFile(input.tags, pdfText[0]);

        return {
          file: `${env.SERVER_ROOT}/pdf/${file}`,
          result,
        };
      }),
    );

    return filesContent.filter(Boolean);
  }

  verifyFile(filePath: string) {
    const fileStat = statSync(filePath);
    const isFile = fileStat.isFile();

    if (isFile) return true;
    return false;
  }

  verifyPDFFile(filePath: string) {
    const fileExtension = extname(filePath);

    if (fileExtension === '.pdf') return true;
    return false;
  }

  getFileList(path: string): string[] {
    return readdirSync(path);
  }

  matchTagsWithFile(tags: string[], pdfText: string) {
    return tags.map((tag: string) => {
      const findRegex = new RegExp(tag.toLowerCase(), 'g');

      const matches = pdfText.toLowerCase().matchAll(findRegex);

      const noOfMatch = [...matches].length;

      return {
        tag,
        no_of_match: noOfMatch,
      };
    });
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
