import { ProcessedData } from './processed-data.interface';

export interface FileProcessor {
  processingFile(buffer: Buffer): Promise<ProcessedData[]>;
}
