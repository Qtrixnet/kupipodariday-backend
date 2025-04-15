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
import { SensitiveDataInterceptor } from '../shared/interceptors/sensitive-data-interceptor';
import { WishesService } from './wishes.service';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { RequestWithUser } from '../shared/types';
import { CreateWishDto } from './dto/create-wish-dto';
import { Wish } from './entities/wish.entity';
import { UpdateWishDto } from './dto/update-wish-dto';

@Controller('wishes')
@UseInterceptors(SensitiveDataInterceptor)
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @UseGuards(JwtGuard)
  @Get(':id')
  getWishById(@Param('id') id: number): Promise<Wish> {
    return this.wishesService.findWishById(id);
  }

  @UseGuards(JwtGuard)
  @Post()
  create(
    @Req() { user }: RequestWithUser,
    @Body() dto: CreateWishDto,
  ): Promise<Wish> {
    return this.wishesService.create(dto, user);
  }

  @Get('top')
  getTopWishes(): Promise<Wish[]> {
    return this.wishesService.getTopWishes();
  }

  @Get('last')
  getLastWishes(): Promise<Wish[]> {
    return this.wishesService.getLastWishes();
  }

  @UseGuards(JwtGuard)
  @Post(':id/copy')
  copyWishById(
    @Req() { user }: RequestWithUser,
    @Param('id') id: number,
  ): Promise<Wish> {
    return this.wishesService.copyWish(id, user);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  updateWishById(
    @Req() { user }: RequestWithUser,
    @Param('id') id: number,
    @Body() dto: UpdateWishDto,
  ): Promise<Wish> {
    return this.wishesService.updateWishWithChecks(id, dto, user);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  deleteWishById(
    @Req() { user }: RequestWithUser,
    @Param('id') id: number,
  ): Promise<Wish> {
    return this.wishesService.removeWishWithChecks(id, user);
  }
}
