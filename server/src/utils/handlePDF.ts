import { PDFImage } from 'pdf-image'
import { config } from 'src/common/env.config'
import { createWorker } from 'tesseract.js'
import { HandleFiles } from './handleFiles'

const handleFiles = new HandleFiles()

export class HandlePDF {
  async convertPDFImage(filePath: string): Promise<string> {
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
      }
    })

    return pdfImage.convertFile()
  }

  async getImageOCRText(imagePath: string): Promise<string> {
    const worker = await createWorker()
    await worker.loadLanguage('eng')
    await worker.initialize('eng')
    const {
      data: { text }
    } = await worker.recognize(imagePath)
    await worker.terminate()
    return text
  }

  async getPDFText(filePath: string): Promise<string> {
    const imagePath = await this.convertPDFImage(filePath)
    const pdfText = await this.getImageOCRText(imagePath)

    await handleFiles.deleteFile(imagePath)
    return pdfText
  }

  async handlePDF(fileName: string) {
    const filePath = `${config.STATIC_FILE}/${fileName}`

    if (!(await handleFiles.isFile(filePath))) return
    if (!handleFiles.isPDF(filePath)) return

    const pdfText = await this.getPDFText(filePath)

    return {
      filePath: `${config.SERVER_URL}/pdf/${fileName}`,
      pdfText
    }
  }
}
