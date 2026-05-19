import { IsString, IsNotEmpty, MinLength, IsIP } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({
    description: "パスワードリセットトークン",
    example: "a1b2c3d4e5f6...",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: "新しいパスワード (最低8文字)",
    example: "NewSecurePassword123!",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password: string;

  @ApiProperty({
    description: "リクエスト元IPアドレス",
    example: "192.168.1.1",
  })
  @IsIP()
  @IsNotEmpty()
  ip_address: string;
}

export class PasswordResetResponseDto {
  @ApiProperty({
    description: "結果メッセージ",
    example: "パスワードリセットのメールを送信しました。",
  })
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
