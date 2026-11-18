import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CurrentUser } from './current-user.decorator';

function getParamDecoratorFactory(
  decorator: () => ParameterDecorator,
): (data: unknown, ctx: ExecutionContext) => unknown {
  class TestController {
    test(@decorator() user: unknown): unknown {
      return user;
    }
  }

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'test',
  ) as Record<
    string,
    { factory: (data: unknown, ctx: ExecutionContext) => unknown }
  >;

  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

const createMockExecutionContext = (
  user?: AuthenticatedUser,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('CurrentUser decorator', () => {
  it('extrae el objeto AuthenticatedUser completo desde request.user', () => {
    const factory = getParamDecoratorFactory(() => CurrentUser());
    const expectedUser: AuthenticatedUser = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'ana@pockit.finance',
    };

    const result = factory(undefined, createMockExecutionContext(expectedUser));

    expect(result).toEqual(expectedUser);
  });

  it('extrae una propiedad específica cuando se indica data', () => {
    const factory = getParamDecoratorFactory(() => CurrentUser('usrId'));
    const expectedUser: AuthenticatedUser = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'ana@pockit.finance',
    };

    const result = factory('usrId', createMockExecutionContext(expectedUser));

    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('retorna undefined si request.user no está presente', () => {
    const factory = getParamDecoratorFactory(() => CurrentUser());

    const result = factory(undefined, createMockExecutionContext(undefined));

    expect(result).toBeUndefined();
  });
});
