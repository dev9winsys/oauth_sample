import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

export enum LoginStatus {
  SUCCESS = "success",
  FAILURE = "failure",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_COMPLETE = "password_reset_complete",
}

@Entity({ name: "login_history" })
@Index(["user_id", "login_at"])
export class LoginHistory {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.loginHistories)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 45 })
  ip_address: string;

  @Column({
    type: "enum",
    enum: LoginStatus,
  })
  login_status: LoginStatus;

  @CreateDateColumn()
  login_at: Date;
}
