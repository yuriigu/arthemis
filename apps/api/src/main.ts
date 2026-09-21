import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/**
 * Função de inicialização (bootstrap) da aplicação NestJS.
 *
 * Responsável por:
 * 1. Instanciar a aplicação NestJS a partir do módulo raiz (AppModule).
 * 2. Configurar pipes globais de validação (ValidationPipe) com class-validator.
 * 3. Iniciar o servidor HTTP na porta definida na variável de ambiente PORT (ou 3000 por padrão).
 */
async function bootstrap() {
  // Cria a instância principal da aplicação HTTP
  const app = await NestFactory.create(AppModule);

  // Habilita a validação automática em todos os endpoints da API
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: remove automaticamente propriedades enviadas no JSON que não estejam no DTO
      whitelist: true,
      // transform: converte automaticamente os tipos de dados para os tipos definidos no DTO
      transform: true,
    }),
  );

  // Inicia o servidor HTTP ouvindo na porta configurada (padrão: 3000)
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 API Arthemis iniciada e ouvindo na porta ${port}`);
}

// Executa a inicialização da aplicação
await bootstrap();
