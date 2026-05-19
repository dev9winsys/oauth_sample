import { ApiProperty } from "@nestjs/swagger";

export class TokenResponseDto {
  @ApiProperty({
    description: "JWTアクセストークン",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  access_token: string;

  @ApiProperty({
    description: "トークンタイプ",
    example: "Bearer",
  })
  token_type: string;

  @ApiProperty({
    description: "トークンの有効期限（秒）",
    example: 3600,
  })
  expires_in: number;

  constructor(access_token: string, expires_in: number) {
    this.access_token = access_token;
    this.token_type = "Bearer";
    this.expires_in = expires_in;
  }
}
