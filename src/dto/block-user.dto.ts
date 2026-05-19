import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsDateString,
  IsString,
  MaxLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from "class-validator";
import { BlockType } from "src/database/entity/user-block-history.entity";

@ValidatorConstraint({ name: "isFutureDate", async: false })
export class IsFutureDate implements ValidatorConstraintInterface {
  validate(dateString: string) {
    if (!dateString) {
      return true; // Optional field
    }
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return false;
    }
    const now = new Date();
    return date > now;
  }

  defaultMessage() {
    return "Block release date must be a valid date in the future";
  }
}

export class BlockUserDto {
  @ApiProperty({
    description: "ユーザーID (UUID)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: "ブロック種類",
    enum: BlockType,
    example: BlockType.WARNING,
  })
  @IsEnum(BlockType)
  block_type: BlockType;

  @ApiProperty({
    description: "ブロック理由",
    example: "不適切な投稿のため",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiProperty({
    description: "ブロック解除日 (ISO 8601形式)",
    example: "2027-12-31T23:59:59.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsFutureDate)
  block_release_date?: string;
}
