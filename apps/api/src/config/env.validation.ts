import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsBoolean, IsOptional, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1000)
  @Max(65535)
  API_PORT: number;

  @IsString()
  API_PREFIX: string;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED?: boolean;

  @IsString()
  @IsOptional()
  SWAGGER_PATH?: string;

  @IsString()
  @IsOptional()
  SWAGGER_TITLE?: string;

  @IsString()
  @IsOptional()
  SWAGGER_VERSION?: string;

  @IsString()
  @IsOptional()
  WEB_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.map((e) => {
      const constraints = e.constraints ? Object.values(e.constraints).join(', ') : 'invalid';
      return `${e.property}: ${constraints}`;
    });
    throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
  }
  
  return validatedConfig;
}
