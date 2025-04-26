import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wish } from './entities/wish.entity';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CreateWishDto } from './dto/create-wish-dto';
import { User } from '../users/entities/user.entity';
import { UpdateWishDto } from './dto/update-wish-dto';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private wishesRepository: Repository<Wish>,
  ) {}

  async create(createWishDto: CreateWishDto, user: User): Promise<Wish> {
    const { id } = await this.wishesRepository.save(
      this.wishesRepository.create({ ...createWishDto, owner: user }),
    );

    return this.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  findOne(options: FindOneOptions<Wish>): Promise<Wish> {
    try {
      return this.wishesRepository.findOneOrFail(options);
    } catch {
      throw new NotFoundException('Wish not found');
    }
  }

  findAll(options: FindOptionsWhere<Wish>): Promise<Wish[]> {
    return this.wishesRepository.findBy(options);
  }

  getTopWishes(): Promise<Wish[]> {
    return this.wishesRepository.find({
      order: { copied: 'desc' },
      take: 20,
      relations: {
        owner: true,
        offers: false,
      },
    });
  }

  getLastWishes(): Promise<Wish[]> {
    return this.wishesRepository.find({
      order: { createdAt: 'asc' },
      take: 40,
      relations: {
        owner: true,
        offers: false,
      },
    });
  }

  findWishById(id: number): Promise<Wish> {
    return this.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });
  }

  async updateOne(id: number, updateWishDto: UpdateWishDto): Promise<Wish> {
    await this.wishesRepository.update(id, updateWishDto);

    return this.findOne({ where: { id } });
  }

  async updateWishWithChecks(
    id: number,
    updateWishDto: UpdateWishDto,
    user: User,
  ): Promise<Wish> {
    const wish = await this.findOne({ where: { id } });

    if (wish.owner.id !== user.id)
      throw new ForbiddenException("You cannot edit someone else's gift");

    if (Object.prototype.hasOwnProperty.call(updateWishDto, 'raised'))
      throw new ForbiddenException(
        'The amount of collected funds cannot be changed',
      );

    const hasOffers = Array.isArray(wish.offers) && wish.offers.length > 0;
    if (hasOffers && updateWishDto.price)
      throw new BadRequestException(
        'Cannot update the price when there are existing offers',
      );

    return this.updateOne(id, updateWishDto);
  }

  async removeOne(wish: Wish): Promise<Wish> {
    await this.wishesRepository.remove(wish);

    return wish;
  }

  async removeWishWithChecks(id: number, user: User): Promise<Wish> {
    const wish = await this.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (wish.owner.id !== user.id) {
      throw new ForbiddenException('You cannot delete someone else’s gift');
    }

    return this.removeOne(wish);
  }

  async copyWish(id: number, user: User): Promise<Wish> {
    const wish = await this.findOne({ where: { id } });
    const { name, link, image, price, description } = wish;

    const existing = await this.wishesRepository.findOne({
      where: { owner: { id: user.id }, link },
    });

    if (existing) {
      throw new ConflictException('You have already copied this gift');
    }

    await this.wishesRepository.increment({ id }, 'copied', 1);

    const newWish = this.wishesRepository.create({
      name,
      link,
      image,
      price,
      description,
      owner: user,
      raised: 0,
      copied: 0,
    });

    return this.wishesRepository.save(newWish);
  }
}
