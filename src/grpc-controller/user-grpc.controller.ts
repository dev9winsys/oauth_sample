import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { UserService, EmailVerificationService } from "src/service";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "src/dto";
import { validateDto } from "./validation.helper";

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

interface UpdateUserRequest {
  id: string;
  email?: string;
  name?: string;
}

interface SoftDeleteUserRequest {
  id: string;
}

interface VerifyEmailRequest {
  token: string;
}

@Controller()
export class UserGrpcController {
  constructor(
    private readonly userService: UserService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @GrpcMethod("UserService", "CreateUser")
  async createUser(data: CreateUserRequest): Promise<UserResponseDto> {
    const createUserDto = new CreateUserDto();
    createUserDto.email = data.email;
    createUserDto.password = data.password;
    createUserDto.name = data.name;

    await validateDto(createUserDto);
    const user = await this.userService.createUser(createUserDto);
    return UserResponseDto.fromEntity(user);
  }

  @GrpcMethod("UserService", "UpdateUser")
  async updateUser(data: UpdateUserRequest): Promise<UserResponseDto> {
    const updateUserDto = new UpdateUserDto();
    if (data.email) updateUserDto.email = data.email;
    if (data.name) updateUserDto.name = data.name;

    await validateDto(updateUserDto);
    const user = await this.userService.updateUser(data.id, updateUserDto);
    return UserResponseDto.fromEntity(user);
  }

  @GrpcMethod("UserService", "SoftDeleteUser")
  async softDeleteUser(data: SoftDeleteUserRequest): Promise<UserResponseDto> {
    const user = await this.userService.softDeleteUser(data.id);
    return UserResponseDto.fromEntity(user);
  }

  @GrpcMethod("UserService", "VerifyEmail")
  async verifyEmail(data: VerifyEmailRequest): Promise<UserResponseDto> {
    const user = await this.emailVerificationService.verifyEmail(data.token);
    return UserResponseDto.fromEntity(user);
  }
}
