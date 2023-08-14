import 'dotenv/config';
import { join } from 'path';

export const config = {
  SERVER_ROOT: process.env.SERVER_ROOT,
  STATIC_FILE: join(__dirname, '..', '..', 'uploads'),
  CV_CACHE_PATH: join(__dirname, '..', '..', 'fetchedData.txt')
} as const;
