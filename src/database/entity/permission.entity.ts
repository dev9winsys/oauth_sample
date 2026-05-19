import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Service, User } from ".";

@Entity({ name: "permission" })
@Index(["service_id", "user_id"])
export class Permission {
  @PrimaryColumn("int")
  user_id: number;

  @PrimaryColumn("int")
  service_id: number;

  @Column()
  permission_type: string;

  @Column()
  permission_start_at: Date;

  @Column()
  permission_end_at: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.permissions)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Service, (service) => service.permissions)
  @JoinColumn({ name: "service_id" })
  service: Service;
}
