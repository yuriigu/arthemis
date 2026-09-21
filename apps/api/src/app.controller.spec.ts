import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

/**
 * Testes unitários do AppController.
 * Verifica o comportamento isolado do controller utilizando o módulo de teste do NestJS.
 */
describe('AppController', () => {
  let appController: AppController;

  // Executado antes de cada teste para inicializar as dependências em um ambiente isolado
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root (rota raiz)', () => {
    it('deve retornar "Hello World!"', () => {
      // Executa o método do controller e valida se o retorno é a saudação esperada
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
