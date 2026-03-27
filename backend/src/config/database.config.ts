import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const entityPaths = [
  path.join(process.cwd(), 'src', 'entities', '*.entity.ts'),
  path.join(process.cwd(), 'dist', 'entities', '*.entity.js'),
];

const migrationPaths = [
  path.join(process.cwd(), 'src', 'migrations', '*.ts'),
  path.join(process.cwd(), 'dist', 'migrations', '*.js'),
];

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USER', 'cnc_mayyanks'),
  password: configService.get('DB_PASSWORD', 'cnc_secret'),
  database: configService.get('DB_NAME', 'cnc_mayyanks_db'),
  entities: entityPaths,
  migrations: migrationPaths,
  migrationsTableName: 'migrations',
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('DB_SSL') === 'true',
  extra: {
    max: 20,
    min: 5,
  },
});

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ttl: 300,
};

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'cnc_mayyanks',
  password: process.env.DB_PASSWORD || 'cnc_secret',
  database: process.env.DB_NAME || 'cnc_mayyanks_db',
  entities: entityPaths,
  migrations: migrationPaths,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
};
