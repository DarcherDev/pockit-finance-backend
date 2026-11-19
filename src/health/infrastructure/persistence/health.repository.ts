import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthProbePort } from '../../domain/ports/out/health-probe.port';

@Injectable()
export class HealthRepository implements HealthProbePort {
  constructor(private readonly dataSource: DataSource) {}

  async pingDatabase(): Promise<void> {
    await this.dataSource.query('SELECT 1');
  }
}
