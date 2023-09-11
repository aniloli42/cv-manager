import { createWorker } from 'tesseract.js';
import { PDFImage } from 'pdf-image';
import { HandleFiles } from './handleFiles';
import { SavedCV } from 'src/cv-handler/cv-handler.service';
import { config } from 'src/common/env.config';

const handleFiles = new HandleFiles();

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

    return pdfImage.convertFile();
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

  async handlePDFFile(fileName: string): Promise<SavedCV | undefined> {
    const filePath = `${config.STATIC_FILE}/${fileName}`;

    if (!(await handleFiles.isFile(filePath))) return undefined;
    if (!handleFiles.isPDF(filePath)) return undefined;

    const pdfText = await this.getPDFText(filePath);

    return {
      filePath: `${config.SERVER_ROOT}/pdf/${fileName}`,
      pdfText,
    };
  }
}
