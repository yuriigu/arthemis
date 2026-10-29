import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto.js';

/**
 * Corpo do `PATCH /organizations/:id`.
 *
 * `PartialType` reusa o `CreateOrganizationDto` deixando **todos** os campos
 * opcionais (e mantendo os decorators de validação/normalização), o que permite
 * atualização parcial: enviar só `name`, só `email` ou os dois.
 *
 * `PartialType` preserva os metadados de validação e documentação. Como é
 * `PartialType`, um corpo sem nenhum dos campos
 * passa pela validação e chega ao serviço, que decide o que fazer.
 */
export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
