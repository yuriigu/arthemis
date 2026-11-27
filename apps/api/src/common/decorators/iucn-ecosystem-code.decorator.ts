import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { IUCN_ECOSYSTEM_CODES } from '../../modules/locations/constants/iucn-ecosystem-codes';

const IUCN_CODE_SET = new Set<string>(IUCN_ECOSYSTEM_CODES);

export function IucnEcosystemCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'iucnEcosystemCode',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value == null || value === '') return true; // opcional / não selecionado
          if (typeof value !== 'string') return false;
          return IUCN_CODE_SET.has(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Código IUCN inválido.';
        },
      },
    });
  };
}
