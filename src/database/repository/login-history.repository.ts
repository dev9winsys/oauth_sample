import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoginHistory } from "../entity/login-history.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
export class LoginHistoryRepository extends BaseRepository<LoginHistory> {
  constructor(
    @InjectRepository(LoginHistory)
    repository: Repository<LoginHistory>,
  ) {
    super(repository);
  }
}
