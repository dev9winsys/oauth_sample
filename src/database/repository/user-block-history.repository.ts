import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserBlockHistory } from "../entity/user-block-history.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
export class UserBlockHistoryRepository extends BaseRepository<UserBlockHistory> {
  constructor(
    @InjectRepository(UserBlockHistory)
    repository: Repository<UserBlockHistory>,
  ) {
    super(repository);
  }
}
