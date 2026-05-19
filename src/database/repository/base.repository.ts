import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  UpdateResult,
  FindOptionsOrder,
} from "typeorm";

/**
 * Type to check if an entity has a delete_flag property
 */
type HasDeleteFlag<T> = T extends { delete_flag: boolean } ? T : never;

export class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Find a single entity
   * @param criteria - Criteria to find the entity
   * @param options - Additional find options like order, relations etc
   * @returns Entity or null if not found
   */
  async findOne(
    criteria: FindOptionsWhere<T>,
    options?: { order?: FindOptionsOrder<T>; relations?: string[] },
  ): Promise<T | null> {
    return this.repository.findOne({
      where: criteria,
      order: options?.order,
      relations: options?.relations,
    });
  }

  /**
   * Find multiple entities
   * @param options - Find options including where, order, relations, etc.
   * @returns Array of entities
   */
  async find(options: {
    where?: FindOptionsWhere<T>;
    order?: FindOptionsOrder<T>;
    relations?: string[];
  }): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Find a single entity with relations
   * @param criteria - Criteria to find the entity
   * @param relations - Relations to load
   * @returns Entity or null if not found
   */
  async findOneWithRelations(
    criteria: FindOptionsWhere<T>,
    relations: string[],
  ): Promise<T | null> {
    return this.repository.findOne({ where: criteria, relations });
  }

  /**
   * Get the underlying TypeORM repository
   * @returns TypeORM Repository
   */
  getRepository(): Repository<T> {
    return this.repository;
  }

  /**
   * Insert a single entity
   * @param entity - Entity data to insert
   * @returns Inserted entity
   */
  async insert(entity: DeepPartial<T>): Promise<T> {
    const created = this.repository.create(entity);
    return this.repository.save(created);
  }

  /**
   * Update an entity
   * @param criteria - Criteria to find the entity
   * @param entity - Partial entity data to update
   * @returns Updated entity or null if not found
   */
  async update(
    criteria: FindOptionsWhere<T>,
    entity: DeepPartial<T>,
  ): Promise<T | null> {
    const existing = await this.repository.findOne({ where: criteria });
    if (!existing) {
      return null;
    }
    const merged = this.repository.merge(existing, entity);
    return this.repository.save(merged);
  }

  /**
   * Bulk update entities matching criteria
   * @param criteria - Criteria to find entities
   * @param entity - Partial entity data to update
   * @returns UpdateResult with affected count
   */
  async bulkUpdate(
    criteria: FindOptionsWhere<T>,
    entity: DeepPartial<T>,
  ): Promise<UpdateResult> {
    return this.repository.update(criteria, entity as any);
  }

  /**
   * Delete an entity (hard delete)
   * @param criteria - Criteria to find the entity
   * @returns True if deleted, false if not found
   */
  async delete(criteria: FindOptionsWhere<T>): Promise<boolean> {
    const result = await this.repository.delete(criteria);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Insert multiple entities
   * @param entities - Array of entity data to insert
   * @returns Array of inserted entities
   */
  async multiInsert(entities: DeepPartial<T>[]): Promise<T[]> {
    const created = this.repository.create(entities);
    return this.repository.save(created);
  }

  /**
   * Soft delete an entity (sets delete_flag to true)
   * This method should only be used for entities with a delete_flag column
   * Type safety: Return type ensures only entities with delete_flag can be soft deleted
   * @param criteria - Criteria to find the entity
   * @returns Updated entity with delete_flag set to true, or null if not found
   */
  async softDelete(
    criteria: FindOptionsWhere<T>,
  ): Promise<(T & HasDeleteFlag<T>) | null> {
    const existing = await this.repository.findOne({ where: criteria });
    if (!existing) {
      return null;
    }
    // Use unknown intermediate cast for type safety while allowing delete_flag assignment
    const merged = this.repository.merge(existing, {
      delete_flag: true,
    } as unknown as DeepPartial<T>);
    const saved = await this.repository.save(merged);
    return saved as T & HasDeleteFlag<T>;
  }
}
