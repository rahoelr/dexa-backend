import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
