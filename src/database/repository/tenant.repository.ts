import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "../entity/tenant.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
export class TenantRepository extends BaseRepository<Tenant> {
  constructor(
    @InjectRepository(Tenant)
    repository: Repository<Tenant>,
  ) {
    super(repository);
  }
}
