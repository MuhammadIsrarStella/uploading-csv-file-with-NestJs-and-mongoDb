import { BadRequestException } from '@nestjs/common';

export class ExcelFileProcessingException extends BadRequestException {
  constructor(message: string) {
    super(message); // Directly passing the message to the parent class
  }
}

export class InvalidHeaderException extends ExcelFileProcessingException {
  constructor(missingHeaders: string[]) {
    const missingFieldsMessage = missingHeaders.map(header => `${header} is missing`).join(', ');
    super(`The following required fields are missing: ${missingFieldsMessage}`);
  }
}

export class InvalidDataException extends ExcelFileProcessingException {
  constructor(columnIndex: number, cellValue: string) {
    super(`Invalid data found in column ${columnIndex + 1}: ${cellValue}`);
  }
}
