import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  ValidateIf,
  IsBoolean,
  IsInt,
  Min,
  IsUrl,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Custom validator to ensure tenant_end_at is after tenant_start_at
 */
function IsAfterStartDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isAfterStartDate",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          if (!value || !relatedValue) return true;
          const startDate = new Date(relatedValue);
          const endDate = new Date(value);
          return endDate > startDate;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be after ${args.constraints[0]}`;
        },
      },
    });
  };
}

export class CreateTenantDto {
  @ApiProperty({
    description: "テナント名",
    example: "サンプル企業",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "テナント開始日時 (ISO 8601形式)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @IsDateString()
  @IsNotEmpty()
  tenant_start_at: Date;

  @ApiProperty({
    description: "テナント終了日時 (ISO 8601形式)",
    example: "2025-12-31T23:59:59.999Z",
  })
  @IsDateString()
  @IsNotEmpty()
  @IsAfterStartDate("tenant_start_at", {
    message: "tenant_end_at must be after tenant_start_at",
  })
  tenant_end_at: Date;

  @ApiPropertyOptional({
    description: "ユーザー自動承認フラグ",
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  auto_user_approval?: boolean;

  @ApiPropertyOptional({
    description: "データ保持期間（日数）",
    example: 90,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  data_retention_days?: number;

  @ApiPropertyOptional({
    description: "テナント画像URL",
    example: "https://example.com/image.png",
  })
  @IsOptional()
  @IsUrl()
  image_url?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: "テナント名",
    example: "サンプル企業（更新）",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: "テナント開始日時 (ISO 8601形式)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  tenant_start_at?: Date;

  @ApiPropertyOptional({
    description: "テナント終了日時 (ISO 8601形式)",
    example: "2025-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.tenant_start_at && o.tenant_end_at)
  @IsAfterStartDate("tenant_start_at", {
    message: "tenant_end_at must be after tenant_start_at",
  })
  tenant_end_at?: Date;

  @ApiPropertyOptional({
    description: "ユーザー自動承認フラグ",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  auto_user_approval?: boolean;

  @ApiPropertyOptional({
    description: "データ保持期間（日数）",
    example: 90,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  data_retention_days?: number;

  @ApiPropertyOptional({
    description: "テナント画像URL",
    example: "https://example.com/image.png",
  })
  @IsOptional()
  @IsUrl()
  image_url?: string;
}

export class TenantResponseDto {
  @ApiProperty({
    description: "テナント内部ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "テナントID (UUID)",
    example: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  })
  tenant_id: string;

  @ApiProperty({
    description: "テナント名",
    example: "サンプル企業",
  })
  name: string;

  @ApiProperty({
    description: "テナント開始日時",
    example: "2024-01-01T00:00:00.000Z",
  })
  tenant_start_at: Date;

  @ApiProperty({
    description: "テナント終了日時",
    example: "2025-12-31T23:59:59.999Z",
  })
  tenant_end_at: Date;

  @ApiProperty({
    description: "削除フラグ",
    example: false,
  })
  delete_flag: boolean;

  @ApiProperty({
    description: "ユーザー自動承認フラグ",
    example: true,
  })
  auto_user_approval: boolean;

  @ApiProperty({
    description: "データ保持期間（日数）",
    example: 90,
  })
  data_retention_days: number;

  @ApiPropertyOptional({
    description: "テナント画像URL",
    example: "https://example.com/image.png",
  })
  image_url?: string;

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
}
