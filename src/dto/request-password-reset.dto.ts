import { IsUUID, IsEmail, IsOptional, IsNotEmpty, IsIP } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestPasswordResetDto {
  @ApiProperty({
    description: "ログインID (UUID形式、メールアドレスと同時に省略不可)",
    example: "550e8400-e29b-41d4-a716-446655440000",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  login_id?: string;

  @ApiProperty({
    description: "メールアドレス (ログインIDと同時に省略不可)",
    example: "user@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: "リクエスト元IPアドレス",
    example: "192.168.1.1",
  })
  @IsIP()
  @IsNotEmpty()
  ip_address: string;
}
