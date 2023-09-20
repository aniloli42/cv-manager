import {
  readFile,
  readdir,
  stat,
  unlink,
  writeFile,
  access,
  constants
} from 'node:fs/promises'
import { basename, extname } from 'path'
import { config } from 'src/common/env.config'
import { CVDataType, SavedCV } from 'src/cv-handler/cv-handler.service'
import { StringDecoder } from 'string_decoder'

export class HandleFiles {
  constructor() {}

  async deleteFile(filePath: string): Promise<void> {
    await unlink(filePath)
  }

  async getDirectoryFiles(path: string): Promise<string[]> {
    const files = await readdir(path)
    return files.filter((file) => extname(file) === '.pdf')
  }

  async isFile(filePath: string): Promise<boolean> {
    const fileStat = await stat(filePath)
    return fileStat.isFile()
  }

  isPDF(filePath: string): boolean {
    const fileExtension = extname(filePath)
    return fileExtension === '.pdf'
  }

  async storeFetchedData(data: SavedCV[]): Promise<void> {
    const filterData = data.filter(
      (fetchedData) => typeof fetchedData === 'object'
    )

    await writeFile(config.CV_CACHE_PATH, JSON.stringify([...filterData]))
  }

  async getSavedDatas(): Promise<SavedCV[] | undefined> {
    try {
      const isFileExists = await this.isFileExists(config.CV_CACHE_PATH)
      if (!isFileExists) return []

      const dataBuffer = await readFile(config.CV_CACHE_PATH)
      const stringDecode = new StringDecoder()

      const preFetchedData = stringDecode.write(dataBuffer)

      return JSON.parse(preFetchedData) as SavedCV[]
    } catch (error) {
      console.error('[Stored File] ', error)
      await unlink(config.CV_CACHE_PATH)
      return []
    }
  }

  async getErrorFiles(): Promise<string[]> {
    try {
      const isFileExists = await this.isFileExists(config.ERROR_FILE_PATH)
      if (!isFileExists) return []

      const dataBuffer = await readFile(config.ERROR_FILE_PATH)
      const stringDecode = new StringDecoder()

      const errorFiles = stringDecode.write(dataBuffer)

      console.log({ errorFiles })

      return JSON.parse(errorFiles)
    } catch (error: unknown) {
      if (error instanceof Error) console.error('[Error Files] ', error.message)
      await unlink(config.ERROR_FILE_PATH)
      return []
    }
  }

  async storeErrorFile(file: string): Promise<void> {
    const errorFiles = await this.getErrorFiles()
    const storeFile = !!errorFiles?.length ? [...errorFiles, file] : [file]

    await writeFile(config.ERROR_FILE_PATH, JSON.stringify(storeFile))
  }

  async storeErrorFiles(files: string[]): Promise<void> {
    await writeFile(config.ERROR_FILE_PATH, JSON.stringify(files))
  }

  async removeErrorFile(file: string): Promise<string[]> {
    const errorFiles = await this.getErrorFiles()

    if (!errorFiles?.length) return []
    const afterRemoveFiles = errorFiles.filter(
      (errorFile) => file !== errorFile
    )
    await this.storeErrorFiles(afterRemoveFiles)

    return afterRemoveFiles
  }

  async removeSavedDatas(
    files: string[],
    fetchedDatas: (CVDataType | SavedCV)[]
  ): Promise<void> {
    const filteredData = fetchedDatas.filter((data): data is SavedCV => {
      if (typeof data !== 'object') return false

      return files.some((fileName) => fileName === basename(data.filePath))
    })

    await writeFile(config.CV_CACHE_PATH, JSON.stringify(filteredData))
  }

  async isFileExists(filePath: string) {
    try {
      await access(filePath, constants.F_OK)
      return true
    } catch (error: unknown) {
      return false
    }
  }

  async cleanFile() {
    await writeFile(config.CV_CACHE_PATH, '[]')
    await writeFile(config.ERROR_FILE_PATH, '[]')

    return `SuccessFully Cleaned`
  }
}
