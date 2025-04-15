import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, ILike, QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import { HashService } from '../hash/hash.service';
import { DatabaseError } from 'pg';
import { UpdateUserDto } from './dto/update-user-dto';
import { Wish } from '../wishes/entities/wish.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private hashService: HashService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const { password } = dto;

    try {
      const hashedPassword = await this.hashService.hash(password);

      const user = this.usersRepository.create({
        ...dto,
        password: hashedPassword,
      });

      return this.usersRepository.save(user);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const errorCode = (error.driverError as DatabaseError).code;

        if (errorCode === '23505')
          throw new ConflictException(
            'User with this email or nickname already exists',
          );
      }

      throw error;
    }
  }

  async findOne(options: FindOneOptions<User>): Promise<User> {
    const user = await this.usersRepository.findOne(options);

    if (!user) throw new NotFoundException();

    return user;
  }

  findMany(query: string): Promise<User[]> {
    return this.usersRepository.find({
      where: [{ email: query }, { username: ILike(`%${query}%`) }],
    });
  }

  findById(id: number): Promise<User> {
    return this.findOne({ where: { id } });
  }

  findByUsername(username: string): Promise<User> {
    return this.findOne({
      where: { username: ILike(`%${username}%`) },
    });
  }

  async updateOne(id: number, dto: UpdateUserDto): Promise<User> {
    await this.findById(id);

    if (dto.password) {
      dto.password = await this.hashService.hash(dto.password);
    }

    await this.usersRepository.update(id, dto);

    return this.findById(id);
  }

  async findWishes(query: { id?: number; username?: string }): Promise<Wish[]> {
    const user = await this.findOne({
      where: query,
      relations: ['wishes', 'wishes.offers', 'wishes.owner'],
    });

    return user.wishes ?? [];
  }
}
