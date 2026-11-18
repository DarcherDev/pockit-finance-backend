import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioResponse } from '../dto/response/usuario.response';
import { UsuarioEntity } from '../entities/usuario.entity';
import { UsuariosMapper } from '../mapper/usuarios.mapper';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repository: jest.Mocked<Pick<UsuariosRepository, 'findById'>>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        UsuariosMapper,
        {
          provide: UsuariosRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('findById retorna UsuarioResponse cuando el usuario existe', async () => {
    const entity = new UsuarioEntity();
    entity.usrId = '550e8400-e29b-41d4-a716-446655440000';
    entity.usrCorreo = 'ana@pockit.finance';
    entity.usrNombre = 'Ana';
    entity.usrApellido = 'García';
    entity.usrEdad = 28;
    entity.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    entity.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    repository.findById.mockResolvedValue(entity);

    const result = await service.findById(entity.usrId);

    expect(repository.findById).toHaveBeenCalledWith(entity.usrId);
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result).not.toBeInstanceOf(UsuarioEntity);
    expect(result).toEqual({
      usrId: entity.usrId,
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
  });

  it('findById retorna null cuando el usuario no existe', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await service.findById(
      '550e8400-e29b-41d4-a716-446655440999',
    );

    expect(result).toBeNull();
  });
});
