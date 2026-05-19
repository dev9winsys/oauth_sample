import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager, FindOptionsWhere } from "typeorm";
import { UUID } from "crypto";
import { TenantRepository } from "src/database/repository/tenant.repository";
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
} from "src/controller/dto/tenant.dto";
import { Tenant } from "src/database/entity/tenant.entity";
import { User } from "src/database/entity/user.entity";

@Injectable()
export class TenantService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tenantRepository: TenantRepository,
  ) {}

  /**
   * Create a new tenant
   * @param createTenantDto - Tenant creation data
   * @returns Created tenant
   */
  async createTenant(
    createTenantDto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.insert(createTenantDto);
    return this.mapToResponseDto(tenant);
  }

  /**
   * Update an existing tenant
   * @param id - Tenant ID
   * @param updateTenantDto - Tenant update data
   * @returns Updated tenant
   */
  async updateTenant(
    id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    const whereClause = this.createWhereClause(id);
    const tenant = await this.tenantRepository.update(
      whereClause,
      updateTenantDto,
    );

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return this.mapToResponseDto(tenant);
  }

  /**
   * Delete a tenant (soft delete) and soft delete all associated users
   * Uses a transaction to ensure atomicity
   * @param id - Tenant ID
   * @returns Deleted tenant
   */
  async deleteTenant(id: string): Promise<TenantResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      // Soft delete the tenant within the transaction
      const tenantRepo = manager.getRepository(Tenant);
      const whereClause = this.createWhereClause(id);
      const tenant = await tenantRepo.findOne({ where: whereClause });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID ${id} not found`);
      }

      // Set delete_flag to true for the tenant
      tenant.delete_flag = true;
      await tenantRepo.save(tenant);

      // Soft delete all users associated with this tenant
      await this.softDeleteTenantUsersInTransaction(manager, id);

      return this.mapToResponseDto(tenant);
    });
  }

  /**
   * Create a where clause for finding a tenant by ID
   * @param id - Tenant ID (UUID)
   * @returns FindOptionsWhere for Tenant
   */
  private createWhereClause(id: string): FindOptionsWhere<Tenant> {
    return { tenant_id: id as UUID };
  }

  /**
   * Soft delete all users associated with a tenant within a transaction
   * @param manager - TypeORM EntityManager for transaction
   * @param tenantId - Tenant ID
   */
  private async softDeleteTenantUsersInTransaction(
    manager: EntityManager,
    tenantId: string,
  ): Promise<void> {
    // Use the transaction manager to ensure atomicity
    await manager
      .createQueryBuilder()
      .update(User)
      .set({ delete_flag: true })
      .where("tenant_id = :tenantId", { tenantId })
      .execute();
  }

  /**
   * Map Tenant entity to TenantResponseDto
   * @param tenant - Tenant entity
   * @returns TenantResponseDto
   */
  private mapToResponseDto(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      tenant_id: tenant.tenant_id as string,
      name: tenant.name,
      tenant_start_at: tenant.tenant_start_at,
      tenant_end_at: tenant.tenant_end_at,
      delete_flag: tenant.delete_flag,
      auto_user_approval: tenant.auto_user_approval,
      data_retention_days: tenant.data_retention_days,
      image_url: tenant.image_url,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
