import { PartialType } from '@nestjs/mapped-types';
import { IsDate, IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

// Base DTO with common fields
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsDate()
  lastLogin?: Date;
}