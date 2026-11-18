import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().min(1).required(),
  DB_SSL: Joi.boolean().truthy('true').falsy('false').default(true),
  DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_PUBLISHABLE_KEY: Joi.string().min(1).required(),
  SUPABASE_SECRET_KEY: Joi.string().min(1).required(),
  SUPABASE_JWKS_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  PASSWORD_RESET_REDIRECT_URL: Joi.string()
    .uri({ scheme: ['http', 'https', 'capacitor', 'pockit'] })
    .default('http://localhost:4200/auth/nueva-password'),
});
