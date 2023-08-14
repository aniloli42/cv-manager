import { readFile, readdir, stat, unlink, writeFile } from "fs/promises";
import { existsSync } from 'fs';
import { extname } from "path";
import { CVDataType, SavedCV } from "src/cv-handler/cv-handler.service";
import { config } from "src/common/env.config";
import { StringDecoder } from "string_decoder";

export class HandleFiles {
  constructor() { }

  async deleteFile(filePath: string): Promise<void> {
    await unlink(filePath);
  }

  async getDirectoryFiles(path: string): Promise<string[]> {
    return await readdir(path);
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

  async storeFetchedData(data: SavedCV[]) {
    const filterData = data.filter(
      (fetchedData) => typeof fetchedData === 'object',
    );


    await writeFile(config.CV_CACHE_PATH, JSON.stringify([...filterData]));
  }

  async getSavedDatas() {
    const isFileExists = this.checkFileExists(config.CV_CACHE_PATH);
    if (!isFileExists) return;

    const dataBuffer = await readFile(config.CV_CACHE_PATH);
    const stringDecode = new StringDecoder();

    const preFetchedData = stringDecode.write(dataBuffer);

    return JSON.parse(preFetchedData);
  }

  checkFileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  async removeSavedDatas(
    files: string[],
    fetchedDatas: CVDataType[] | SavedCV[],
  ) {
    const filteredData = fetchedDatas.filter((data) => {
      if (typeof data !== 'object') return;

      return files.some(
        (fileName) => fileName === data.filePath.split('/').at(-1),
      );
    });

    await writeFile(config.CV_CACHE_PATH, JSON.stringify(filteredData));
  }
}