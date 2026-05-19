import { IsUUID, IsNotEmpty, IsIP } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RecordLoginFailureDto {
  @ApiProperty({
    description: "ユーザーID (UUID形式)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: "ログインIPアドレス",
    example: "192.168.1.1",
  })
  @IsIP()
  @IsNotEmpty()
  ip_address: string;
}

export class LoginFailureResponseDto {
  @ApiProperty({
    description: "ログイン失敗回数",
    example: 1,
  })
  failure_count: number;

  @ApiProperty({
    description: "メッセージ",
    example:
      "ログインに失敗しました。5回失敗するとアカウントがブロックされます。",
  })
  message: string;

  @ApiProperty({
    description: "アカウントがブロックされたかどうか",
    example: false,
  })
  blocked: boolean;

  constructor(failure_count: number, message: string, blocked: boolean) {
    this.failure_count = failure_count;
    this.message = message;
    this.blocked = blocked;
  }
}
