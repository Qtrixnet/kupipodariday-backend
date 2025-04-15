import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { SensitiveDataInterceptor } from '../shared/interceptors/sensitive-data-interceptor';
import { WishlistsService } from './wishlists.service';
import { RequestWithUser } from '../shared/types';
import { Wishlist } from './entities/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist-dto';
import { UpdateWishlistDto } from './dto/update-wishlist-dto';

@UseGuards(JwtGuard)
@Controller('wishlists')
@UseInterceptors(SensitiveDataInterceptor)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  create(
    @Req() { user }: RequestWithUser,
    @Body() dto: CreateWishlistDto,
  ): Promise<Wishlist> {
    return this.wishlistsService.create(user, dto);
  }

  @Get()
  getAllWishlists(): Promise<Wishlist[]> {
    return this.wishlistsService.findAll();
  }

  @Patch(':id')
  updateWishlistById(
    @Req() { user }: RequestWithUser,
    @Param('id') id: number,
    @Body() dto: UpdateWishlistDto,
  ): Promise<Wishlist> {
    return this.wishlistsService.updateOne(id, dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Wishlist> {
    return this.wishlistsService.findById(id);
  }

  @Delete(':id')
  deleteWishlistById(
    @Req() { user }: RequestWithUser,
    @Param('id') id: number,
  ): Promise<Wishlist> {
    return this.wishlistsService.removeOne(id, user);
  }
}
