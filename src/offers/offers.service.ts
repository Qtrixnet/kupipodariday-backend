import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { DataSource, FindOneOptions, QueryRunner, Repository } from 'typeorm';
import { CreateOfferDto } from './dto/create-offer-dto';
import { User } from '../users/entities/user.entity';
import { Wish } from '../wishes/entities/wish.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    private dataSource: DataSource,
  ) {}

  private checkOfferConstraints(user: User, wish: Wish, amount: number): void {
    if (user.id === wish.owner.id) {
      throw new BadRequestException('You cannot contribute to your own gift');
    }
    if (wish.raised === wish.price) {
      throw new BadRequestException('Funds are already fully collected');
    }
    const total = wish.raised + amount;
    if (total > wish.price) {
      throw new BadRequestException(
        'Collected amount cannot exceed gift price',
      );
    }
  }

  async create(dto: CreateOfferDto, userId: number): Promise<Offer> {
    const { amount, itemId } = dto;

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOneOrFail(User, {
        where: { id: userId },
      });
      const wish = await queryRunner.manager.findOneOrFail(Wish, {
        where: { id: itemId },
        relations: ['owner', 'offers'],
        lock: { mode: 'pessimistic_write' },
      });

      this.checkOfferConstraints(user, wish, amount);

      await queryRunner.manager.increment(
        Wish,
        { id: wish.id },
        'raised',
        amount,
      );

      const offer = queryRunner.manager.create(Offer, {
        ...dto,
        user,
        item: wish,
      });
      const saved = await queryRunner.manager.save(Offer, offer);

      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(options: FindOneOptions<Offer>): Promise<Offer> {
    const offer = await this.offersRepository.findOne(options);

    if (!offer) throw new NotFoundException('Offer not found');

    return offer;
  }

  findOfferById(id: number): Promise<Offer> {
    return this.findOne({ where: { id }, relations: ['user', 'item'] });
  }

  findAll(): Promise<Offer[]> {
    return this.offersRepository.find({
      relations: ['user', 'item'],
    });
  }
}
