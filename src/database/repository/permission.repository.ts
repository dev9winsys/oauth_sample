import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Permission } from "../entity/permission.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
export class PermissionRepository extends BaseRepository<Permission> {
  constructor(
    @InjectRepository(Permission)
    repository: Repository<Permission>,
  ) {
    super(repository);
  }
}
