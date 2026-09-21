import { Injectable } from '@nestjs/common';

/**
 * Serviço responsável pela regra de negócio básica da rota raiz.
 */
@Injectable()
export class AppService {
  /**
   * Retorna a mensagem de saudação padrão da aplicação.
   *
   * @returns Mensagem textual 'Hello World!'
   */
  getHello(): string {
    return 'Hello World!';
  }
}
