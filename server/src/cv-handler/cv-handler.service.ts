import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { config } from 'src/common/env.config';
import { cpus } from 'os';
import { unlink } from 'node:fs/promises'
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

@Injectable()
export class CvHandlerService {
  private handleFiles: HandleFiles;
  private handlePDF: HandlePDF;

  constructor() {
    this.handleFiles = new HandleFiles();
    this.handlePDF = new HandlePDF();
  }

  async handleCVMatching(input: CVInputDTO) {
    try {
      let files = await this.handleFiles.getDirectoryFiles(config.STATIC_FILE);
      let errorFiles = await this.handleFiles.getErrorFiles()

      if (!!errorFiles?.length && !!files?.length) {
        errorFiles = errorFiles.filter(errorFile => files.includes(errorFile))

        await this.handleFiles.storeErrorFiles(errorFiles)
      }

      if (!!files?.length) files = files.filter(file => !errorFiles?.includes(file))

      let savedDatas = await this.handleFiles.getSavedDatas();

      if (!savedDatas?.length && !files?.length) throw new NotFoundException(`Pdf not found to filter`)

      if (!!savedDatas?.length && !files?.length) {
        await unlink(config.CV_CACHE_PATH)
        throw new NotFoundException(`Pdf not found to filter`)
      }

      if (!!savedDatas?.length && !!files?.length) savedDatas = await this.resolveDanglingFile(files, savedDatas)

      const newFiles = await this.getNewFiles(files, savedDatas);

      if (newFiles?.length === 0) {

        const finalData = await this.processSavedCVs(savedDatas, input.tags);
        const errors = await this.handleFiles.getErrorFiles()
        return {
          finalData, errors
        }
      }

      savedDatas = await this.handleNewPDFs(newFiles, savedDatas);


      const finalData = await this.processSavedCVs(savedDatas, input.tags)
      const errors = await this.handleFiles.getErrorFiles()

      return {
        finalData, errors
      }

    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException(err.message ?? 'An error occurred while processing CVs.');
    }
  }

  private async resolveDanglingFile(allFiles: string[], savedDatas: SavedCV[]) {
    const cleanFiles = savedDatas.filter(data => allFiles.includes(
      this.extractFileName(data.filePath)))

    await this.handleFiles.storeFetchedData(cleanFiles)

    return cleanFiles
  }

  private async getNewFiles(allFiles: string[], savedDatas: SavedCV[]) {
    if (savedDatas?.length === 0) return allFiles

    const storedFiles = savedDatas?.map((data) => this.extractFileName(data.filePath));
    return allFiles?.filter((file) => !storedFiles?.includes(this.extractFileName(file)));
  }

  private extractFileName(filePath: string) {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  private async processSavedCVs(savedDatas: SavedCV[], tags: string[]) {
    const processedCVs: CVDataType[] = [];
    if (savedDatas?.length === 0) throw new Error(`Data not found to process`)

    for (const { filePath, pdfText } of savedDatas) {
      const result = this.matchTagsWithPDFText(tags, pdfText);

      processedCVs.push({
        filePath,
        result,
        pdfText,
      });
    }

    return processedCVs;
  }

  private matchTagsWithPDFText(tags: string[], pdfText: string): MatchTagType[] {
    return tags.map((tag: string) => {
      const tagRegex = new RegExp(tag.toLowerCase(), 'g');
      const matches = pdfText.toLowerCase().matchAll(tagRegex);

      const noOfMatch = [...matches].length;
      return {
        tag,
        no_of_match: noOfMatch,
      };
    });
  }

  private async handleNewPDFs(newFiles: string[], savedDatas: SavedCV[]) {
    let storedFiles = !!savedDatas?.length ? [...savedDatas] : []
    await PromisePool.withConcurrency(cpus()?.length ?? 8)
      .for(newFiles)
      .withTaskTimeout(150_000)
      .onTaskStarted((file, pool) =>
        console.log(
          {
            _file: file,
            _current: pool.processedCount(),
            _time: (new Date()).toISOString()
          }
        ))
      .handleError(async (error, file) =>
        await this.handleErrorFile(error, file
        ))
      .process(async (cvData) => {
        if (typeof cvData !== 'string') return;

        const pdfResult = await this.handlePDF.handlePDFFile(cvData);

        if (pdfResult == undefined) return '';

        storedFiles.push(pdfResult)
        await this.handleFiles.storeFetchedData(storedFiles);
      });
    return storedFiles
  }

  async handleErrorFile(error: Error, file: string) {
    console.log({ _message: error.message, _file: file })
    await this.handleFiles.storeErrorFile(file)
  }

  // Expose a method to retrieve fetched files
  async fetchedFiles() {
    return this.handleFiles.getSavedDatas();
  }
}
