import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO (Data Transfer Object) responsável por receber e validar
 * os dados enviados no corpo da requisição de login.
 */
export class LoginDto {
  /**
   * E-mail do usuário cadastrado no sistema.
   * Deve ser um endereço de e-mail válido e não pode ser vazio.
   */
  @IsEmail({}, { message: 'O e-mail informado deve ser um endereço válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  /**
   * Senha em texto puro enviada pelo cliente.
   * Deve ser uma string não vazia e possuir no mínimo 6 caracteres.
   */
  @IsString({ message: 'A senha deve ser uma cadeia de caracteres.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  password: string;
}
