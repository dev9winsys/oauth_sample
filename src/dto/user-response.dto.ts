import { ApiProperty } from "@nestjs/swagger";
import { User, ActivityStatus } from "src/database/entity";

export class UserResponseDto {
  @ApiProperty({
    description: "ユーザー内部ID (Serial)",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "ユーザーID (UUID)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  user_id: string;

  @ApiProperty({
    description: "ユーザー名",
    example: "山田太郎",
  })
  name: string;

  @ApiProperty({
    description: "メールアドレス",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({
    description: "メール認証済みフラグ",
    example: false,
  })
  email_verified: boolean;

  @ApiProperty({
    description: "削除フラグ",
    example: false,
  })
  delete_flag: boolean;

  @ApiProperty({
    description: "活動ステータス",
    enum: ActivityStatus,
    example: ActivityStatus.NORMAL,
  })
  activity_status: ActivityStatus;

  @ApiProperty({
    description: "作成日時",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "更新日時",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const response = new UserResponseDto();
    response.id = user.id;
    response.user_id = user.user_id;
    response.name = user.name;
    response.email = user.email;
    response.email_verified = user.email_verified;
    response.delete_flag = user.delete_flag;
    response.activity_status = user.activity_status;
    response.createdAt = user.createdAt;
    response.updatedAt = user.updatedAt;
    return response;
  }
}
