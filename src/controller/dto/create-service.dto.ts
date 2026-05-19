import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsDate,
  MaxLength,
  IsOptional,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateServiceDto {
  @ApiProperty({
    description: "ユーザーID (UUID形式)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: "サービス名（最大50文字）",
    example: "マイサービス",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  service_name: string;

  @ApiProperty({
    description: "サービスのホームURL",
    example: "https://example.com",
  })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  home_url: string;

  @ApiProperty({
    description: "サービス開始日時 (ISO 8601形式)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  service_start_at: Date;

  @ApiPropertyOptional({
    description: "サービス終了日時 (ISO 8601形式)",
    example: "2025-12-31T23:59:59.999Z",
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  service_end_at?: Date;
}
