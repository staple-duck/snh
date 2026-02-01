import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  
  const globalPrefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(globalPrefix);
  
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',') : '*',
    credentials: true,
  });
  
  const swaggerEnabled = config.get<boolean>('SWAGGER_ENABLED', true);
  if (swaggerEnabled) {
    const swaggerTitle = config.get<string>('SWAGGER_TITLE', 'SNH Tree API');
    const swaggerVersion = config.get<string>('SWAGGER_VERSION', '1.0');
    const swaggerPath = config.get<string>('SWAGGER_PATH', 'api/docs');
    
    const documentConfig = new DocumentBuilder()
      .setTitle(swaggerTitle)
      .setDescription('The API for managing hierarchical tree structures. Built with NestJS, Prisma, and PostgreSQL.')
      .setVersion(swaggerVersion)
      .addTag('tree')
      .build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup(swaggerPath, app, document);
    
    Logger.log(`📖 Swagger documentation available at: http://localhost:${config.get('API_PORT')}/${swaggerPath}`);
  }
  
  const port = config.get<number>('API_PORT', 3000);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const webUrl = config.get<string>('WEB_URL', 'http://localhost:4200');
  
  await app.listen(port);
  
  Logger.log('');
  Logger.log('================================');
  Logger.log(`  SNH Tree API [${nodeEnv.toUpperCase()}]`);
  Logger.log('================================');
  Logger.log(`🌐 UI:      ${webUrl}`);
  Logger.log(`🚀 API:     http://localhost:${port}/${globalPrefix}`);
  
  if (swaggerEnabled) {
    const swaggerPath = config.get<string>('SWAGGER_PATH', 'api/docs');
    Logger.log(`📖 Swagger: http://localhost:${port}/${swaggerPath}`);
  }
  
  Logger.log(`🏥 Health:  http://localhost:${port}/${globalPrefix}/health`);
  Logger.log('================================');
  Logger.log('');
}

bootstrap();
