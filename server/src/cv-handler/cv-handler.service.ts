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
  async handleCVMatching(input: CVInputDTO) {
    const isFile = this.verifyFile(input.filePath);

    if (isFile) {
      const isPDFFile = this.verifyPDFFile(input.filePath);
      if (!isPDFFile) throw new Error(`Select PDF file`);

      const pdfContext = await this.getPdfContext(input.filePath);

      if ('error' in pdfContext) throw new Error(`Unable to read pdf`);
      const pdfText = pdfContext.text_pages;

      const result = this.matchTagsWithFile(input.tags, pdfText[0]);

      return { file: input.filePath, result };
    }

    const files = this.getFileList(input.filePath);

    const filesContent = await Promise.all(
      files?.map(async (file) => {
        const filePath = `${input.filePath}\/${file}`;

        const isFile = this.verifyFile(filePath);
        if (!isFile) return null;

        const isPDFFile = this.verifyPDFFile(filePath);
        if (!isPDFFile) return null;

        const pdfContext = await this.getPdfContext(filePath);

        if ('error' in pdfContext) return pdfContext.error;
        const pdfText = pdfContext.text_pages;

        const result = this.matchTagsWithFile(input.tags, pdfText[0]);

        return {
          file: filePath,
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
