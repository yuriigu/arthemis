import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

export const CurrentUser = createParamDecorator<
  keyof AuthenticatedUser | undefined,
  AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] | undefined
>((data, context: ExecutionContext) => {
  const request = context
    .switchToHttp()
    .getRequest<{ user?: AuthenticatedUser }>();
  return data ? request.user?.[data] : request.user;
});
