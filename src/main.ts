import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['http://localhost:4200', 'http://localhost:3001'];

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Pretty startup log
  console.log('\n');
  console.log('  ╔═══════════════════════════════╗');
  console.log('  ║       VALKIRIC  API  v1.0.0   ║');
  console.log('  ╠═══════════════════════════════╣');
  console.log(`  ║   http://localhost:${port}    ║`);
  console.log(`  ║       ${process.env.NODE_ENV || 'development'}               ║`);
  console.log('  ╚═══════════════════════════════╝');
  console.log('\n');
}

bootstrap();
