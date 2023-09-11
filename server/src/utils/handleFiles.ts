import { readFile, readdir, stat, unlink, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, basename } from 'path';
import { CVDataType, SavedCV } from 'src/cv-handler/cv-handler.service';
import { config } from 'src/common/env.config';
import { StringDecoder } from 'string_decoder';
import { InternalServerErrorException } from '@nestjs/common';

export class HandleFiles {
  constructor() {}

  async deleteFile(filePath: string): Promise<void> {
    await unlink(filePath);
  }

  async getDirectoryFiles(path: string): Promise<string[]> {
    const files = await readdir(path);
    return files.filter((file) => extname(file) === '.pdf');
  }

  async isFile(filePath: string): Promise<boolean> {
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  }

  isPDF(filePath: string): boolean {
    const fileExtension = extname(filePath);
    return fileExtension === '.pdf';
  }

  async storeFetchedData(data: SavedCV[]): Promise<void> {
    const filterData = data.filter(
      (fetchedData): fetchedData is SavedCV => typeof fetchedData === 'object',
    );

    await writeFile(config.CV_CACHE_PATH, JSON.stringify([...filterData]));
  }

  async getSavedDatas(): Promise<SavedCV[] | undefined> {
    try {
      if (!this.checkFileExists(config.CV_CACHE_PATH)) return;

      const dataBuffer = await readFile(config.CV_CACHE_PATH);
      const stringDecode = new StringDecoder();

      const preFetchedData = stringDecode.write(dataBuffer);

      return JSON.parse(preFetchedData) as SavedCV[];
    } catch (error) {
      throw new InternalServerErrorException(`Stored File Corrupted`);
    }
  }

  async getErrorFiles(): Promise<string[]> {
    if (!this.checkFileExists(config.ERROR_FILE_PATH)) return undefined;

    const dataBuffer = await readFile(config.ERROR_FILE_PATH);
    const stringDecode = new StringDecoder();

    const errorFiles = stringDecode.write(dataBuffer);

    return JSON.parse(errorFiles);
  }

  async storeErrorFile(file: string): Promise<void> {
    const errorFiles = await this.getErrorFiles();

    await writeFile(
      config.ERROR_FILE_PATH,
      JSON.stringify(errorFiles ? [...errorFiles, file] : [file]),
    );
  }

  async storeErrorFiles(files: string[]): Promise<void> {
    await writeFile(config.ERROR_FILE_PATH, JSON.stringify(files));
  }

  async removeErrorFile(file: string): Promise<string[]> {
    const errorFiles = await this.getErrorFiles();

    if (!errorFiles?.length) return [];
    const afterRemoveFiles = errorFiles.filter(
      (errorFile) => file !== errorFile,
    );
    await this.storeErrorFiles(afterRemoveFiles);

    return afterRemoveFiles;
  }

  checkFileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  async removeSavedDatas(
    files: string[],
    fetchedDatas: (CVDataType | SavedCV)[],
  ): Promise<void> {
    const filteredData = fetchedDatas.filter((data): data is SavedCV => {
      if (typeof data !== 'object') return false;

      return files.some((fileName) => fileName === basename(data.filePath));
    });

    await writeFile(config.CV_CACHE_PATH, JSON.stringify(filteredData));
  }

  async cleanFile() {
    await writeFile(config.CV_CACHE_PATH, '[]');

    return `SuccessFully Cleaned`;
  }
}
