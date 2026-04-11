import { IsEmail, IsString, MinLength, Matches, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must have at least one uppercase letter and one number',
  })
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class VerifyTwoFactorDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
