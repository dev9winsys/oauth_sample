import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Service, Permission } from ".";
import { hashPassword, generateUuidV7 } from "../utils";
import { UserBlockHistory } from "./user-block-history.entity";
import { LoginHistory } from "./login-history.entity";

export enum ActivityStatus {
  NORMAL = "normal",
  WARNING = "warning",
  TEMPORARY_SUSPENSION = "temporary_suspension",
  PERMANENT_BLOCK = "permanent_block",
}

@Entity({ name: "users" })
@Index(["email"])
export class User {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Index({ unique: true })
  @Column("uuid")
  user_id: string;

  @Column({ length: 50 })
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  email_verification_token: string;

  @Column({ nullable: true })
  verification_token_expires_at: Date;

  @Column({ default: false })
  delete_flag: boolean;

  @Column({
    type: "enum",
    enum: ActivityStatus,
    default: ActivityStatus.NORMAL,
  })
  activity_status: ActivityStatus;

  @Column({ default: 0 })
  login_failure_count: number;

  @Column({ type: "simple-json", nullable: true })
  previous_passwords: string[];

  @Column({ nullable: true })
  pending_email: string;

  @Column({ nullable: true })
  password_reset_token: string;

  @Column({ nullable: true })
  password_reset_token_expires_at: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Service, (service) => service.user)
  services?: Service[];

  @OneToMany(() => Permission, (permission) => permission.user)
  permissions?: Permission[];

  @OneToMany(() => UserBlockHistory, (blockHistory) => blockHistory.user)
  blockHistories?: UserBlockHistory[];

  @OneToMany(() => LoginHistory, (loginHistory) => loginHistory.user)
  loginHistories?: LoginHistory[];

  @BeforeInsert()
  generateUserId() {
    if (!this.user_id) {
      this.user_id = generateUuidV7();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !/^\$2[abxy]?\$/.test(this.password)) {
      this.password = await hashPassword(this.password);
    }
  }
}
