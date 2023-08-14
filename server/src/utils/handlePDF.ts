
import { config } from 'src/common/env.config';
import { createWorker } from 'tesseract.js';
import { HandleFiles } from './handleFiles';
import { SavedCV } from 'src/cv-handler/cv-handler.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFImage } = require('pdf-image');
const handleFiles = new HandleFiles()

export class HandlePDF {

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
        '-trim': '',
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

  async getPDFText(filePath: string): Promise<string> {
    const imagePath = await this.convertPDFToImage(filePath);
    const pdfText = await this.getTextFromImageOCR(imagePath);

    await handleFiles.deleteFile(imagePath);
    return pdfText;
  }

  async handlePDFFile(fileName: string): Promise<SavedCV> {
    const File_Path = `${config.STATIC_FILE}\/${fileName}`;

    const isFile = handleFiles.checkIsFile(File_Path);
    if (!isFile) return;

    const isPDFFile = handleFiles.checkIsPDF(File_Path);
    if (!isPDFFile) return;

    const pdfText = await this.getPDFText(File_Path);

    return {
      filePath: `${config.SERVER_ROOT}/pdf/${fileName}`,
      pdfText,
    };
  }
}
