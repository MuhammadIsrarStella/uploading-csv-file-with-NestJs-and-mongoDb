import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExcelFileData, ExcelFileDataSchema } from '../schema/excel-file-data';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        return { uri };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: ExcelFileData.name, schema: ExcelFileDataSchema }]),
  ],
})
export class DatabaseModule {}
