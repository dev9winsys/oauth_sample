import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEmail, IsOptional } from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "ユーザー名",
    example: "山田太郎",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "メールアドレス",
    example: "newemail@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
