# Repository Usage Guide

This document provides examples of how to use the entity repositories in this project.

## Overview

The repository pattern provides a clean abstraction layer for database operations. Each entity has its own repository that extends the `BaseRepository` class.

## Available Repositories

- `UserRepository` - For User entity operations (supports soft delete)
- `TenantRepository` - For Tenant entity operations (supports soft delete)
- `ServiceRepository` - For Service entity operations
- `PermissionRepository` - For Permission entity operations

## Password Security

The User entity automatically handles password hashing using bcrypt. When you save a user with a plain-text password, it will be automatically hashed before being stored in the database.

```typescript
import { UserRepository } from 'src/database/repository';
import { comparePassword } from 'src/database/utils';

// Creating a user with plain-text password
const user = await userRepository.insert({
  tenant_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'mySecurePassword123', // Will be automatically hashed
});

// The password is now hashed in the database
console.log(user.password); // $2b$10$...

// To verify a password during login
const isValid = await comparePassword('mySecurePassword123', user.password);
```

**Important Notes:**
- Passwords are automatically hashed on insert and update
- Use `comparePassword()` utility function to verify passwords
- Never store or compare plain-text passwords directly
- The hashing uses bcrypt with 10 salt rounds for security

## Repository Methods

### 1. Insert
Insert a single entity into the database.

```typescript
import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser() {
    const user = await this.userRepository.insert({
      tenant_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'plainPassword123', // Will be automatically hashed
    });
    return user;
  }
}
```

### 2. Update
Update an existing entity.

```typescript
async updateUser(userId: string) {
  const updatedUser = await this.userRepository.update(
    { id: userId },
    { name: 'Jane Doe' }
  );
  
  if (!updatedUser) {
    throw new NotFoundException('User not found');
  }
  
  return updatedUser;
}
```

### 3. Delete
Hard delete an entity from the database.

```typescript
async deleteUser(userId: string) {
  const deleted = await this.userRepository.delete({ id: userId });
  
  if (!deleted) {
    throw new NotFoundException('User not found');
  }
  
  return { success: true };
}
```

### 4. Multi-Insert
Insert multiple entities at once.

```typescript
async createMultipleUsers() {
  const users = await this.userRepository.multiInsert([
    {
      tenant_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password1', // Will be automatically hashed
    },
    {
      tenant_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password2', // Will be automatically hashed
    },
  ]);
  return users;
}
```

### 5. Soft Delete
Soft delete an entity by setting the `delete_flag` to true (only for entities with `delete_flag` column).

**Note:** Only `User` and `Tenant` entities support soft delete as they have a `delete_flag` column.

```typescript
async softDeleteUser(userId: string) {
  const softDeletedUser = await this.userRepository.softDelete({ id: userId });
  
  if (!softDeletedUser) {
    throw new NotFoundException('User not found');
  }
  
  return softDeletedUser;
}
```

## Setting Up Repositories in a Module

To use repositories in your NestJS module, you need to import them:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Tenant, Service, Permission } from 'src/database/entity';
import {
  UserRepository,
  TenantRepository,
  ServiceRepository,
  PermissionRepository,
} from 'src/database/repository';
import { YourService } from './your.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, Service, Permission]),
  ],
  providers: [
    UserRepository,
    TenantRepository,
    ServiceRepository,
    PermissionRepository,
    YourService,
  ],
  exports: [
    UserRepository,
    TenantRepository,
    ServiceRepository,
    PermissionRepository,
  ],
})
export class YourModule {}
```

## Important Notes

1. **Soft Delete vs Hard Delete**: 
   - Use `softDelete()` for entities with `delete_flag` (User, Tenant)
   - Use `delete()` for permanent deletion or entities without `delete_flag` (Service, Permission)

2. **Return Values**:
   - `insert()` and `update()` return the entity or `null` if not found
   - `delete()` returns a boolean indicating success
   - `multiInsert()` returns an array of inserted entities
   - `softDelete()` returns the soft-deleted entity or `null` if not found

3. **TypeORM Integration**: 
   - All repositories use TypeORM under the hood
   - You can extend repositories with custom methods as needed

## Example: Complete Service Implementation

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/database/repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: any) {
    return await this.userRepository.insert(userData);
  }

  async updateUser(userId: string, updateData: any) {
    const user = await this.userRepository.update({ id: userId }, updateData);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(userId: string) {
    const deleted = await this.userRepository.delete({ id: userId });
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return { success: true };
  }

  async softDeleteUser(userId: string) {
    const user = await this.userRepository.softDelete({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createMultipleUsers(usersData: any[]) {
    return await this.userRepository.multiInsert(usersData);
  }
}
```
