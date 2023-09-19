import {
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { PromisePool } from '@supercharge/promise-pool'
import { unlink } from 'node:fs/promises'
import { config } from 'src/common/env.config'
import { HandleFiles } from 'src/utils/handleFiles'
import { HandlePDF } from 'src/utils/handlePDF'
import { CVInputDTO } from './dtos/body-input.input'

export type MatchTagType = {
  tag: string
  no_of_match: number
}

export type CVDataType = {
  filePath: string
  result: MatchTagType[]
  pdfText: string
}

export type SavedCV = Omit<CVDataType, 'result'>

@Injectable()
export class CvHandlerService {
  private handleFiles: HandleFiles
  private handlePDF: HandlePDF

  constructor() {
    this.handleFiles = new HandleFiles()
    this.handlePDF = new HandlePDF()
  }

  async handleCVMatching(input: CVInputDTO) {
    try {
      let files = await this.handleFiles.getDirectoryFiles(config.STATIC_FILE)
      let errorFiles = await this.handleFiles.getErrorFiles()

      if (!!errorFiles?.length && !!files?.length) {
        errorFiles = errorFiles?.filter((errorFile) =>
          files.includes(errorFile)
        )
        files = files.filter((file) => !errorFiles?.includes(file))

        await this.handleFiles.storeErrorFiles(errorFiles)
      }

      let savedDatas = await this.handleFiles.getSavedDatas()

      if (!savedDatas?.length && !files?.length)
        throw new NotFoundException(`Pdf not found to filter`)

      if (!!savedDatas?.length && !!files?.length)
        savedDatas = await this.removeExtraData(files, savedDatas)

      const newFiles = await this.getNewFiles(files, savedDatas)

      if (!newFiles?.length) {
        const finalData = await this.processTagsWithPDF(savedDatas, input.tags)
        const errors = await this.handleFiles.getErrorFiles()
        return {
          finalData,
          errors
        }
      }

      savedDatas = await this.handleNewPDFs(newFiles, savedDatas)

      const finalData = await this.processTagsWithPDF(savedDatas, input.tags)
      const errors = await this.handleFiles.getErrorFiles()

      return {
        finalData,
        errors
      }
    } catch (err) {
      throw new InternalServerErrorException(
        err.message ?? 'An error occurred while processing CVs.'
      )
    }
  }

  private async removeExtraData(files: string[], savedDatas: SavedCV[]) {
    const filteredFiles = savedDatas.filter((data) =>
      files.includes(this.extractFileName(data.filePath))
    )

    await this.handleFiles.storeFetchedData(filteredFiles)

    return filteredFiles
  }

  private async getNewFiles(allFiles: string[], savedDatas: SavedCV[]) {
    if (savedDatas?.length === 0) return allFiles

    const storedFiles = savedDatas?.map((data) =>
      this.extractFileName(data.filePath)
    )
    return allFiles?.filter(
      (file) => !storedFiles?.includes(this.extractFileName(file))
    )
  }

  private extractFileName(filePath: string) {
    const parts = filePath.split('/')
    return parts[parts.length - 1]
  }

  private async processTagsWithPDF(savedDatas: SavedCV[], tags: string[]) {
    const processedCVs: CVDataType[] = []
    if (savedDatas?.length === 0) throw new Error(`Data not found to process`)

    for (const { filePath, pdfText } of savedDatas) {
      const result = this.matchTagsWithPDFText(tags, pdfText)

      processedCVs.push({
        filePath,
        result,
        pdfText
      })
    }

    return processedCVs
  }

  private matchTagsWithPDFText(
    tags: string[],
    pdfText: string
  ): MatchTagType[] {
    return tags.map((tag: string) => {
      const tagRegex = new RegExp(tag.toLowerCase(), 'g')
      const matches = pdfText.toLowerCase().matchAll(tagRegex)

      const noOfMatch = [...matches].length
      return {
        tag,
        no_of_match: noOfMatch
      }
    })
  }

  private async handleNewPDFs(newFiles: string[], savedDatas: SavedCV[]) {
    const storedFiles = !!savedDatas?.length ? [...savedDatas] : []
    await PromisePool.for(newFiles)
      .withConcurrency(10)
      .withTaskTimeout(300_000)
      .onTaskStarted((file) => {
        console.log(`[${new Date().toISOString()}]: ${file}`)
      })
      .handleError(
        async (error, file) => await this.handleErrorFile(error, file)
      )
      .process(async (cvData) => {
        if (typeof cvData !== 'string') return
        const pdfResult = await this.handlePDF.handlePDF(cvData)
        if (!pdfResult) return

        storedFiles.push(pdfResult)
        await this.handleFiles.storeFetchedData(storedFiles)
      })
    return storedFiles
  }

  async handleErrorFile(error: Error, file: string) {
    console.error(`[Error]: ${file}\n[Message]: ${error.message}`)
    await this.handleFiles.storeErrorFile(file)
  }

  // Expose a method to retrieve fetched files
  async fetchedFiles() {
    return await this.handleFiles.getSavedDatas()
  }

  async cleanErrors() {
    return await this.handleFiles.cleanFile()
  }
}
