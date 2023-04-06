import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { unlink, stat, readdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { env } from 'src/common/env.config';
import { StringDecoder } from 'string_decoder';
import { createWorker } from 'tesseract.js';
import { CVInputDTO } from './dtos/body-input.input';

import { PromisePool } from '@supercharge/promise-pool';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFImage } = require('pdf-image');

const STATIC_FILE = join(__dirname, '..', '..', 'uploads');
const CV_CACHE_PATH = join(__dirname, '..', '..', 'fetchedData.txt');

type MatchTagType = {
  tag: string;
  no_of_match: number;
};

type CVDataType = {
  filePath: string;
  result: MatchTagType[];
  pdfText: string;
};

type SavedCV = Omit<CVDataType, 'result'>;

@Injectable()
export class CvHandlerService {
  async handleCVMatching(input: CVInputDTO) {
    try {
      const files = await this.getDirectoryFileList(STATIC_FILE);

      let preFetchFileData: SavedCV[] | undefined =
        await this.getPreFetchedData();
      let notFetchedFileList = undefined;

      if (
        preFetchFileData != null &&
        Array.isArray(preFetchFileData) &&
        preFetchFileData.length !== 0
      ) {
        await this.removeFromPreFetchedData(files, preFetchFileData);
        preFetchFileData = await this.getPreFetchedData();

        const storedFileList = this.getFileList(preFetchFileData);
        notFetchedFileList = files.filter(
          (file) => !storedFileList.includes(file),
        );
      }

      if (
        preFetchFileData == null ||
        (Array.isArray(preFetchFileData) && preFetchFileData.length === 0)
      )
        notFetchedFileList = files;

      if (
        notFetchedFileList != null &&
        notFetchedFileList.length === 0 &&
        files.length === preFetchFileData?.length
      ) {
        const finalResult: CVDataType[] = [];

        for await (const { filePath, pdfText } of preFetchFileData) {
          const result = this.matchTagsWithPDFText(input.tags, pdfText);

          finalResult.push({
            filePath,
            result,
            pdfText,
          });
        }

        return finalResult;
      }

      if (notFetchedFileList?.length == 0) return [];

      await PromisePool.withConcurrency(5)
        .for(notFetchedFileList)
        .withTaskTimeout(60000)
        .process(async (cvData) => {
          if (typeof cvData !== 'string') return;

          const pdfResult = await this.handlePDFFile(cvData);

          if (pdfResult == undefined) return '';
          if (preFetchFileData != null)
            preFetchFileData = [...preFetchFileData, pdfResult];
          if (preFetchFileData == null) preFetchFileData = [pdfResult];

          await this.storeFetchedData(preFetchFileData);
        });

      if (preFetchFileData != null && preFetchFileData.length !== 0) {
        preFetchFileData = preFetchFileData.map((data): CVDataType => {
          const result = this.matchTagsWithPDFText(input.tags, data.pdfText);

          return { ...data, result };
        });
      }

      return preFetchFileData;
    } catch (error) {
      console.error({ error });

      return error;
    }
  }

  async storeFetchedData(data: SavedCV[]) {
    await writeFile(CV_CACHE_PATH, JSON.stringify([...data]));
  }

  async getPreFetchedData() {
    const isFileExists = this.checkFileExists(CV_CACHE_PATH);
    if (!isFileExists) return;

    const dataBuffer = await readFile(CV_CACHE_PATH);
    const stringDecode = new StringDecoder();

    const preFetchedData = stringDecode.write(dataBuffer);

    return JSON.parse(preFetchedData);
  }

  checkFileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  async removeFromPreFetchedData(
    currentFileList: string[],
    preFetchedData: CVDataType[] | SavedCV[],
  ) {
    const filteredData = preFetchedData.filter((data) => {
      return currentFileList.some(
        (fileName) => fileName === data.filePath.split('/').at(-1),
      );
    });

    await writeFile(CV_CACHE_PATH, JSON.stringify(filteredData));
  }

  isCVDataType(obj: unknown): obj is CVDataType {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'filePath' in obj &&
      'result' in obj &&
      'pdfText' in obj
    );
  }

  getFileList(dataArray: CVDataType[] | SavedCV[]) {
    return dataArray.flatMap((data) => data.filePath.split('/').at(-1));
  }

  async handlePDFFile(fileName: string): Promise<SavedCV> {
    const File_Path = `${STATIC_FILE}\/${fileName}`;

    const isFile = this.verifyIsFile(File_Path);
    if (!isFile) return;

    const isPDFFile = this.verifyIsPDF(File_Path);
    if (!isPDFFile) return;

    const pdfText = await this.getPDFText(File_Path);

    return {
      filePath: `${env.SERVER_ROOT}/pdf/${fileName}`,
      pdfText,
    };
  }

  async verifyIsFile(filePath: string): Promise<boolean> {
    const fileStat = await stat(filePath);
    const isFile = fileStat.isFile();

    if (isFile) return true;
    return false;
  }

  verifyIsPDF(filePath: string): boolean {
    const fileExtension = extname(filePath);
    if (fileExtension === '.pdf') return true;
    return false;
  }

  async getDirectoryFileList(path: string): Promise<string[]> {
    return await readdir(path);
  }

  matchTagsWithPDFText(tags: string[], pdfText: string): MatchTagType[] {
    return tags.map((tag: string) => {
      tag = tag.toLowerCase();
      pdfText = pdfText.toLowerCase();

      const tagRegex = new RegExp(tag, 'g');
      const matches = pdfText.matchAll(tagRegex);

      const noOfMatch = [...matches].length;
      return {
        tag,
        no_of_match: noOfMatch,
      };
    });
  }

  async getPDFText(filePath: string): Promise<string> {
    const imagePath = await this.convertPDFToImage(filePath);
    const pdfText = await this.getTextFromImageOCR(imagePath);

    await this.deleteFileFromStorage(imagePath);
    return pdfText;
  }

  async convertPDFToImage(filePath: string): Promise<string> {
    const pdfImage = new PDFImage(filePath, {
      combinedImage: true,
      convertOptions: {
        '-quality': '100',
        '-verbose': '',
        '-density': '160',
        '-trim': '',
        '-flatten': '',
        '-sharpen': '0x1.0',
      },
    });

    return await pdfImage.convertFile();
  }

  async getTextFromImageOCR(imagePath: string): Promise<string> {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    await worker.terminate();
    return text;
  }

  async deleteFileFromStorage(filePath: string): Promise<void> {
    await unlink(filePath);
  }
}
