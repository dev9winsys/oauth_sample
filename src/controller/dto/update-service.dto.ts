import {
  IsString,
  IsOptional,
  IsDate,
  MaxLength,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateServiceDto {
  @ApiPropertyOptional({
    description: "サービス名（最大50文字）",
    example: "マイサービス（更新）",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  service_name?: string;

  @ApiPropertyOptional({
    description: "サービスのホームURL",
    example: "https://example.com",
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  home_url?: string;

  @ApiPropertyOptional({
    description: "サービス開始日時 (ISO 8601形式)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  service_start_at?: Date;
}
