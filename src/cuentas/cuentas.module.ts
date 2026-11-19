import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentasMapper } from './application/mappers/cuentas.mapper';
import { CuentasService } from './application/services/cuentas.service';
import { CUENTAS_REPOSITORY_PORT } from './domain/ports/out/cuentas-repository.port';
import { CuentaEntity } from './infrastructure/persistence/entities/cuenta.entity';
import { CuentaPersistenceMapper } from './infrastructure/persistence/mappers/cuenta-persistence.mapper';
import { CuentasRepository } from './infrastructure/persistence/repositories/cuentas.repository';
import { CuentasController } from './presentation/controllers/cuentas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CuentaEntity])],
  controllers: [CuentasController],
  providers: [
    CuentaPersistenceMapper,
    CuentasRepository,
    {
      provide: CUENTAS_REPOSITORY_PORT,
      useExisting: CuentasRepository,
    },
    CuentasMapper,
    CuentasService,
  ],
  exports: [CuentasService],
})
export class CuentasModule {}
