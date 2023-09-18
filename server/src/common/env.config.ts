import 'dotenv/config';
import { join } from 'path';

export const config = {
  SERVER_URL: process.env.SERVER_URL,
  STATIC_FILE: join(__dirname, '..', '..', 'uploads'),
  CV_CACHE_PATH: join(__dirname, '..', '..', 'fetchedData.txt'),
  ERROR_FILE_PATH: join(__dirname, '..', '..', 'errorFiles.txt'),
} as const;
