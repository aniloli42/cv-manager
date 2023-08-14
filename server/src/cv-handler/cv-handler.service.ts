import { Injectable } from '@nestjs/common';
import { config } from 'src/common/env.config';
import { cpus } from 'os';
import { CVInputDTO } from './dtos/body-input.input';
import { PromisePool } from '@supercharge/promise-pool';
import { HandleFiles } from 'src/utils/handleFiles';
import { HandlePDF } from 'src/utils/handlePDF';


export type MatchTagType = {
  tag: string;
  no_of_match: number;
};

export type CVDataType = {
  filePath: string;
  result: MatchTagType[];
  pdfText: string;
};

export type SavedCV = Omit<CVDataType, 'result'>;

const handleFiles = new HandleFiles()
const handlePDF = new HandlePDF()

@Injectable()
export class CvHandlerService {

  async handleCVMatching(input: CVInputDTO) {
    try {
      const files = await handleFiles.getDirectoryFiles(config.STATIC_FILE);


      let savedDatas: SavedCV[] | undefined =
        await handleFiles.getSavedDatas();
      let newFiles = undefined;

      if (!!savedDatas?.length) {
        await handleFiles.removeSavedDatas(files, savedDatas);
        savedDatas = await handleFiles.getSavedDatas();

        const storedFiles = this.getFiles(savedDatas);
        newFiles = files.filter((file) => !storedFiles.includes(file));
      }

      if (!savedDatas?.length)
        newFiles = files;

      if (
        newFiles?.length === 0 &&
        files.length === savedDatas?.length
      ) {
        const finalResult: CVDataType[] = [];

        for await (const { filePath, pdfText } of savedDatas) {
          const result = this.matchTagsWithPDFText(input.tags, pdfText);

          finalResult.push({
            filePath,
            result,
            pdfText,
          });
        }

        return finalResult;
      }

      if (newFiles?.length === 0) return [];

      await this.handleNewPDFs(newFiles, savedDatas)

      if (savedDatas != null && savedDatas.length !== 0) {
        savedDatas = savedDatas.map((data): CVDataType => {
          const result = this.matchTagsWithPDFText(input.tags, data.pdfText);

          return { ...data, result };
        });
      }

      return savedDatas;
    }
    catch (err) {
      console.log({ err })
      return err

    }
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

  getFiles(dataList: CVDataType[] | SavedCV[]) {
    return dataList.map((data: CVDataType | SavedCV) => data.filePath.split('/').at(-1));
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

  async handleNewPDFs(newFiles: string[], savedDatas: SavedCV[]) {
    await PromisePool.withConcurrency(cpus()?.length ?? 8)
      .for(newFiles)
      .useCorrespondingResults()
      .withTaskTimeout(75_000)
      .handleError((error) => {
        console.error({
          error_time: new Date(),
          error_message: error.message
        });
      })
      .process(async (cvData) => {
        if (typeof cvData !== 'string') return;

        const pdfResult = await handlePDF.handlePDFFile(cvData);


        if (pdfResult == undefined) return '';
        if (savedDatas)
          savedDatas = [...savedDatas, pdfResult];
        if (savedDatas == null) savedDatas = [pdfResult];

        await handleFiles.storeFetchedData(savedDatas);
      });
  }

  // reply file endpoint
  async fetchedFiles() {
    return await handleFiles.getSavedDatas();
  }
}
