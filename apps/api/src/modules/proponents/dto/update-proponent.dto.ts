import { PartialType } from '@nestjs/mapped-types';
import { CreateProponentDto } from './create-proponent.dto.js';

/**
 * Corpo do `PATCH /proponents/:id`.
 *
 * `PartialType` reusa o `CreateProponentDto` deixando **todos** os campos
 * opcionais (e mantendo os decorators de validação/normalização), o que permite
 * atualização parcial: enviar só `name`, só `email` ou os dois.
 *
 * `@nestjs/mapped-types` é o pacote oficial do Nest para esse caso sem exigir
 * o `@nestjs/swagger`. Como é `PartialType`, um corpo sem nenhum dos campos
 * passa pela validação e chega ao serviço, que decide o que fazer.
 */
export class UpdateProponentDto extends PartialType(CreateProponentDto) {}
