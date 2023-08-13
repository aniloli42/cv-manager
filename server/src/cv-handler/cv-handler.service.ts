import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { unlink, stat, readdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { env } from 'src/common/env.config';
import { StringDecoder } from 'string_decoder';
import { createWorker } from 'tesseract.js';
import { CVInputDTO } from './dtos/body-input.input';
import { cpus } from 'os'
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
      const files = await this.getDirectoryFiles(STATIC_FILE);

      let preFetchedDatas: SavedCV[] | undefined =
        await this.getPreFetchedDatas();
      let newFiles = undefined;

      if (
        preFetchedDatas != null &&
        Array.isArray(preFetchedDatas) &&
        preFetchedDatas.length !== 0
      ) {
        await this.removePreFetchedDatas(files, preFetchedDatas);
        preFetchedDatas = await this.getPreFetchedDatas();

        const storedFiles = this.getFiles(preFetchedDatas);
        newFiles = files.filter(
          (file) => !storedFiles.includes(file),
        );
      }

      if (
        preFetchedDatas == null ||
        (Array.isArray(preFetchedDatas) && preFetchedDatas.length === 0)
      )
        newFiles = files;

      if (
        newFiles != null &&
        newFiles.length === 0 &&
        files.length === preFetchedDatas?.length
      ) {
        const finalResult: CVDataType[] = [];

        for await (const { filePath, pdfText } of preFetchedDatas) {
          const result = this.matchTagsWithPDFText(input.tags, pdfText);

          finalResult.push({
            filePath,
            result,
            pdfText,
          });
        }

        return finalResult;
      }


      if (newFiles?.length == 0) return [];



      await PromisePool.withConcurrency(cpus()?.length ?? 8)
        .for(newFiles).useCorrespondingResults()
        .withTaskTimeout(75_000)
        .handleError(handleError => {
          console.log({ handleError })
        })
        .process(async (cvData) => {
          if (typeof cvData !== 'string') return;

          const pdfResult = await this.handlePDFFile(cvData);

          if (pdfResult == undefined) return '';
          if (preFetchedDatas != null)
            preFetchedDatas = [...preFetchedDatas, pdfResult];
          if (preFetchedDatas == null) preFetchedDatas = [pdfResult];

          await this.storeFetchedData(preFetchedDatas);
        });

      if (preFetchedDatas != null && preFetchedDatas.length !== 0) {
        preFetchedDatas = preFetchedDatas.map((data): CVDataType => {
          const result = this.matchTagsWithPDFText(input.tags, data.pdfText);

          return { ...data, result };
        });
      }

      return preFetchedDatas;
    } catch (error) {
      console.error({ error });
      return error;
    }
  }

  async storeFetchedData(data: SavedCV[]) {
    const filterData = data.filter(fetchedData => typeof fetchedData === 'object')

    await writeFile(CV_CACHE_PATH, JSON.stringify([...filterData]));
  }

  async getPreFetchedDatas() {
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

  async removePreFetchedDatas(
    currentFileList: string[],
    preFetchedData: CVDataType[] | SavedCV[],
  ) {
    const filteredData = preFetchedData.filter((data) => {
      if (typeof data !== 'object') return
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

  getFiles(dataArray: CVDataType[] | SavedCV[]) {
    return dataArray.flatMap((data) => data.filePath.split('/').at(-1));
  }

  async handlePDFFile(fileName: string): Promise<SavedCV> {
    const File_Path = `${STATIC_FILE}\/${fileName}`;

    const isFile = this.checkIsFile(File_Path);
    if (!isFile) return;

    const isPDFFile = this.checkIsPDF(File_Path);
    if (!isPDFFile) return;

    const pdfText = await this.getPDFText(File_Path);

    return {
      filePath: `${env.SERVER_ROOT}/pdf/${fileName}`,
      pdfText,
    };
  }

  async checkIsFile(filePath: string): Promise<boolean> {
    const fileStat = await stat(filePath);
    const isFile = fileStat.isFile();

    if (isFile) return true;
    return false;
  }

  checkIsPDF(filePath: string): boolean {
    const fileExtension = extname(filePath);
    if (fileExtension === '.pdf') return true;
    return false;
  }

  async getDirectoryFiles(path: string): Promise<string[]> {
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
        '-quality': '85',
        '-verbose': '',
        '-density': '200',
        '-antialias': '',
        '-flatten': '',
        '-sharpen': '0x2.0',
        '-trim': ''
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

  async fetchedFiles() {
    const data = await this.getPreFetchedDatas()
    return data
  }
}
