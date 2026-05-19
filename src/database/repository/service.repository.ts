import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Service } from "../entity/service.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
export class ServiceRepository extends BaseRepository<Service> {
  constructor(
    @InjectRepository(Service)
    repository: Repository<Service>,
  ) {
    super(repository);
  }
}
