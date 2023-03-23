import { Injectable } from '@nestjs/common';
import { readdirSync, statSync } from 'fs';
import { unlink } from 'fs/promises';
import { extname, join } from 'path';
import { env } from 'src/common/env.config';
import { createWorker } from 'tesseract.js';
import { CVInputDTO } from './dtos/body-input.input';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFImage } = require('pdf-image');

const STATIC_FILE = join(__dirname, '..', '..', 'uploads');

@Injectable()
export class CvHandlerService {
  async handleCVMatching(input: CVInputDTO) {
    const files = this.getFileList(STATIC_FILE);

    const filesContent = [];
    for await (const file of files) {
      const filePath = `${STATIC_FILE}\/${file}`;

      const isFile = this.verifyFile(filePath);
      if (!isFile) continue;

      const isPDFFile = this.verifyPDFFile(filePath);
      if (!isPDFFile) continue;

      const pdfText = await this.getPdfText(filePath);

      const result = this.matchTagsWithFile(input.tags, pdfText);

      filesContent.push({
        file: `${env.SERVER_ROOT}/pdf/${file}`,
        result,
        text: pdfText,
      });
    }

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
      const searchTag = tag.toLowerCase();
      const findRegex = new RegExp(searchTag, 'g');
      const searchingIn = pdfText.toLowerCase();

      const matches = searchingIn.matchAll(findRegex);

      const noOfMatch = [...matches].length;

      return {
        tag,
        no_of_match: noOfMatch,
      };
    });
  }

  async getPdfText(filePath: string) {
    const pdfImage = new PDFImage(filePath, {
      combinedImage: true,
      // convertOptions: {
      //   '-quality': '100',
      //   '-verbose': '',
      //   '-density': '100',
      //   '-trim': '',
      //   '-flatten': '',
      //   '-sharpen': '0x1.0',
      // },
    });
    const imageFilePath = await pdfImage.convertFile();
    const pdfText = await this.handleImageOCR(imageFilePath);

    await this.removeTempFiles(imageFilePath);

    return pdfText;
  }

  async handleImageOCR(imagePath) {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    await worker.terminate();
    return text;
  }

  async removeTempFiles(filePath: string) {
    await unlink(filePath);
  }
}
