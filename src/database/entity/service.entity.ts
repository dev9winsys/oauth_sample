import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from "typeorm";
import { Permission, User } from ".";
import { generateUuidV7 } from "../utils";

@Entity({ name: "service" })
@Index(["service_id", "user_id"])
export class Service {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Index({ unique: true })
  @Column("uuid")
  service_id: string;

  @Column("int")
  user_id: number;

  @Column({ length: 50 })
  service_name: string;

  @Column({ nullable: false })
  home_url: string;

  @Column()
  service_start_at: Date;

  @Column()
  service_end_at: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.services)
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => Permission, (permission) => permission.service)
  permissions?: Permission[];

  @BeforeInsert()
  generateServiceId() {
    if (!this.service_id) {
      this.service_id = generateUuidV7();
    }
  }
}
