import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    IsNotEmpty,
    IsOptional
} from 'class-validator';

/**
 * DTO for user registration
 */
export class RegisterDto {
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Name cannot be more than 50 characters' })
    name!: string;

    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(100, { message: 'Password cannot be more than 100 characters' })
    password!: string;
}

/**
 * DTO for user login
 */
export class LoginDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    password!: string;
}

/**
 * DTO for refresh token
 */
export class RefreshTokenDto {
    @IsString({ message: 'Refresh token must be a string' })
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken!: string;
}
