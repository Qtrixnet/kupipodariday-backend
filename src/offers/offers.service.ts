import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { WishesService } from '../wishes/wishes.service';
import { UsersService } from '../users/users.service';
import { CreateOfferDto } from './dto/create-offer-dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    private wishesService: WishesService,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateOfferDto, userId: number): Promise<Offer> {
    const { amount, itemId } = dto;

    const user = await this.usersService.findOne({
      where: { id: userId },
      relations: ['wishes', 'wishlists', 'offers'],
    });

    const wish = await this.wishesService.findOne({
      where: { id: itemId },
      relations: ['owner', 'offers'],
    });

    if (user.id === wish.owner.id)
      throw new BadRequestException(
        'You cannot contribute money to your own gifts',
      );

    if (wish.raised === wish.price)
      throw new BadRequestException(
        'Funds have already been collected for this gift.',
      );

    const donationAndCurrentSum = wish.raised + amount;

    if (donationAndCurrentSum > wish.price)
      throw new BadRequestException(
        'The amount of collected funds cannot exceed the gift’s price',
      );

    await this.wishesService.updateOne(itemId, {
      raised: donationAndCurrentSum,
    });

    return this.offersRepository.save({
      ...dto,
      user,
      item: wish,
    });
  }

  async findOne(options: FindOneOptions<Offer>): Promise<Offer> | never {
    const offer = await this.offersRepository.findOne(options);

    if (!offer) throw new NotFoundException();

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
