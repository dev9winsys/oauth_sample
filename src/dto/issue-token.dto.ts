import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsIP,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

class ServiceDto {
  @ApiProperty({
    description: "サービスID",
    example: "service-1",
  })
  @IsString()
  @IsNotEmpty()
  service_id: string;

  @ApiProperty({
    description: "サービス名",
    example: "マイサービス",
  })
  @IsString()
  @IsNotEmpty()
  service_name: string;

  @ApiProperty({
    description: "サービスに対する権限のリスト",
    example: ["read", "write", "delete"],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}

export class IssueTokenDto {
  @ApiProperty({
    description: "ユーザーID (UUID形式)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: "サービスと権限のリスト（オプション）",
    type: [ServiceDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];

  @ApiProperty({
    description: "ログインIPアドレス",
    example: "192.168.1.1",
  })
  @IsIP()
  @IsNotEmpty()
  ip_address: string;
}
