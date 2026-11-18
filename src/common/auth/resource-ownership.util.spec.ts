import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../exceptions/domain.exception';
import { assertResourceOwnership } from './resource-ownership.util';

describe('assertResourceOwnership', () => {
  const ownerId = '550e8400-e29b-41d4-a716-446655440000';
  const otherId = '660e8400-e29b-41d4-a716-446655440111';

  it('no lanza error cuando ownerUsrId coincide exactamente con currentUsrId', () => {
    expect(() => assertResourceOwnership(ownerId, ownerId)).not.toThrow();
  });

  it('lanza DomainException 403 RECURSO_NO_AUTORIZADO cuando los IDs no coinciden', () => {
    expect(() => assertResourceOwnership(ownerId, otherId)).toThrow(
      DomainException,
    );

    try {
      assertResourceOwnership(ownerId, otherId);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainException);
      const domainError = error as DomainException;
      expect(domainError.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(domainError.code).toBe('RECURSO_NO_AUTORIZADO');
    }
  });

  it('lanza DomainException 403 cuando ownerUsrId está vacío', () => {
    expect(() => assertResourceOwnership('', ownerId)).toThrow(DomainException);
    expect(() => assertResourceOwnership('   ', ownerId)).toThrow(
      DomainException,
    );
  });

  it('lanza DomainException 403 cuando currentUsrId está vacío', () => {
    expect(() => assertResourceOwnership(ownerId, '')).toThrow(DomainException);
    expect(() => assertResourceOwnership(ownerId, '   ')).toThrow(
      DomainException,
    );
  });
});
