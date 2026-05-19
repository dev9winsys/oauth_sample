import { validate } from "class-validator";
import { RpcException } from "@nestjs/microservices";

/**
 * Validates a DTO and throws RpcException if validation fails
 * @param dto The DTO instance to validate
 * @throws RpcException with validation errors
 */
export async function validateDto(dto: object): Promise<void> {
  const errors = await validate(dto);
  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints || {}).join(", "))
      .join("; ");
    throw new RpcException({
      code: 3, // INVALID_ARGUMENT
      message: `Validation failed: ${messages}`,
    });
  }
}

/**
 * Validates and parses a date string
 * @param dateString The date string to parse
 * @param fieldName The field name for error messages
 * @returns Date object
 * @throws RpcException if date is invalid
 */
export function validateAndParseDate(
  dateString: string,
  fieldName: string,
): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new RpcException({
      code: 3, // INVALID_ARGUMENT
      message: `Invalid date format for ${fieldName}: ${dateString}`,
    });
  }
  return date;
}
