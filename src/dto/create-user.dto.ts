import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    description: "ユーザー名",
    example: "山田太郎",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "メールアドレス",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "パスワード",
    example: "SecurePassword123!",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
