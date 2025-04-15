import {
  IsOptional,
  IsUrl,
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDefined,
} from 'class-validator';

export class CreateUserDto {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  password: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsString()
  about?: string;
}
