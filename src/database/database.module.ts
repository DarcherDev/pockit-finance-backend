import { Global, Module } from '@nestjs/common';
import { UNIT_OF_WORK_PORT } from '../common/domain';
import { TypeOrmUnitOfWork } from './typeorm-unit-of-work';

@Global()
@Module({
  providers: [
    TypeOrmUnitOfWork,
    {
      provide: UNIT_OF_WORK_PORT,
      useExisting: TypeOrmUnitOfWork,
    },
  ],
  exports: [UNIT_OF_WORK_PORT, TypeOrmUnitOfWork],
})
export class DatabaseModule {}
