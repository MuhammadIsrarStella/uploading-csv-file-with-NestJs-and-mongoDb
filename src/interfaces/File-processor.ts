import { ProcessedData } from './Processed-data';

export interface FileProcessor {
  processingFile(buffer: Buffer): Promise<ProcessedData[]>;
}
