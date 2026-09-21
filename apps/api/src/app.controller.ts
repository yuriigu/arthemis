import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

/**
 * Controller responsável pela rota raiz da aplicação ('/').
 * Serve como verificação rápida de status de funcionamento (health check básico).
 */
@Controller()
export class AppController {
  /**
   * Injeta o serviço AppService via injeção de dependências do NestJS.
   *
   * @param appService Instância do serviço que provê a resposta da rota raiz.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Rota HTTP GET '/'
   * Retorna uma mensagem de boas-vindas para indicar que a API está no ar.
   *
   * @returns String contendo 'Hello World!'
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
