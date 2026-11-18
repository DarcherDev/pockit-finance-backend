import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../entities/usuario.entity';
import { UsuariosRepository } from './usuarios.repository';

describe('UsuariosRepository', () => {
  let repository: UsuariosRepository;
  let typeOrmRepo: jest.Mocked<Pick<Repository<UsuarioEntity>, 'findOne'>>;

  beforeEach(async () => {
    typeOrmRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosRepository,
        {
          provide: getRepositoryToken(UsuarioEntity),
          useValue: typeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<UsuariosRepository>(UsuariosRepository);
  });

  it('findById retorna la entidad cuando existe el usuario', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const expected = new UsuarioEntity();
    expected.usrId = usrId;
    expected.usrCorreo = 'ana@pockit.finance';
    typeOrmRepo.findOne.mockResolvedValue(expected);

    const result = await repository.findById(usrId);

    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { usrId },
    });
    expect(result).toBe(expected);
  });

  it('findById retorna null cuando no existe el usuario', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440999';
    typeOrmRepo.findOne.mockResolvedValue(null);

    const result = await repository.findById(usrId);

    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { usrId },
    });
    expect(result).toBeNull();
  });
});
