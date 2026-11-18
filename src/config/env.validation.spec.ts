import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/postgres',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    SUPABASE_SECRET_KEY: 'sb_secret_test',
    SUPABASE_JWKS_URL:
      'https://example.supabase.co/auth/v1/.well-known/jwks.json',
  };

  it('valida correctamente cuando están todas las variables obligatorias y aplica defaults', () => {
    const result = envValidationSchema.validate(validEnv, {
      allowUnknown: true,
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      PORT: 3000,
      DB_SSL: true,
      DB_LOGGING: false,
      CORS_ORIGINS: '',
      PASSWORD_RESET_REDIRECT_URL: 'http://localhost:4200/auth/nueva-password',
    });
  });

  it.each([
    'http://localhost:4200/auth/nueva-password',
    'https://app.pockit.finance/auth/nueva-password',
    'capacitor://localhost/auth/nueva-password',
    'pockit://auth/nueva-password',
  ])(
    'acepta esquemas permitidos para PASSWORD_RESET_REDIRECT_URL (%s)',
    (redirectUrl) => {
      const result = envValidationSchema.validate(
        {
          ...validEnv,
          PASSWORD_RESET_REDIRECT_URL: redirectUrl,
        },
        { allowUnknown: true },
      );

      expect(result.error).toBeUndefined();
      expect(result.value).toMatchObject({
        PASSWORD_RESET_REDIRECT_URL: redirectUrl,
      });
    },
  );

  it.each(['not-a-uri', 'ftp://example.com/reset', ''])(
    'falla si PASSWORD_RESET_REDIRECT_URL es inválida (%p)',
    (invalidRedirectUrl) => {
      const { error } = envValidationSchema.validate(
        {
          ...validEnv,
          PASSWORD_RESET_REDIRECT_URL: invalidRedirectUrl,
        },
        { allowUnknown: true },
      );

      expect(error).toBeDefined();
    },
  );

  it('acepta valores booleanos en string para DB_SSL y DB_LOGGING', () => {
    const result = envValidationSchema.validate(
      {
        ...validEnv,
        PORT: '4000',
        DB_SSL: 'false',
        DB_LOGGING: 'true',
        CORS_ORIGINS: 'https://app.pockit.finance,http://localhost:5173',
      },
      { allowUnknown: true },
    );

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      PORT: 4000,
      DB_SSL: false,
      DB_LOGGING: true,
      CORS_ORIGINS: 'https://app.pockit.finance,http://localhost:5173',
    });
  });

  it.each([
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_JWKS_URL',
  ])('falla si falta la variable obligatoria %s', (missingKey) => {
    const envCopy = { ...validEnv } as Record<string, unknown>;
    delete envCopy[missingKey];

    const { error } = envValidationSchema.validate(envCopy, {
      allowUnknown: true,
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain(missingKey);
  });

  it('falla si SUPABASE_URL no es una URL válida', () => {
    const { error } = envValidationSchema.validate(
      {
        ...validEnv,
        SUPABASE_URL: 'not-a-url',
      },
      { allowUnknown: true },
    );

    expect(error).toBeDefined();
  });

  it('falla si SUPABASE_JWKS_URL no es una URL válida', () => {
    const { error } = envValidationSchema.validate(
      {
        ...validEnv,
        SUPABASE_JWKS_URL: 'not-a-jwks-url',
      },
      { allowUnknown: true },
    );

    expect(error).toBeDefined();
  });

  it.each(['DATABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'])(
    'falla si %s es una cadena vacía',
    (emptyKey) => {
      const { error } = envValidationSchema.validate(
        {
          ...validEnv,
          [emptyKey]: '',
        },
        { allowUnknown: true },
      );

      expect(error).toBeDefined();
    },
  );

  it.each([70000, 'abc'])('falla si PORT es inválido (%p)', (invalidPort) => {
    const { error } = envValidationSchema.validate(
      {
        ...validEnv,
        PORT: invalidPort,
      },
      { allowUnknown: true },
    );

    expect(error).toBeDefined();
  });
});
