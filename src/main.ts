import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./exceptions/http-exception.filter";
import { NestFactory } from "@nestjs/core";

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
      app.enableCors();
      app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
      app.useGlobalFilters(new HttpExceptionFilter());
  
    await app.listen(3001);
  }
  bootstrap();
  
