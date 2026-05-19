import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
} from "typeorm";
import { generateUuidV7 } from "../utils";

@Entity({ name: "tenant" })
export class Tenant {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Index({ unique: true })
  @Column("uuid")
  tenant_id: string;

  @Column({ length: 50 })
  name: string;

  @Column()
  tenant_start_at: Date;

  @Column()
  tenant_end_at: Date;

  @Column({ default: false })
  delete_flag: boolean;

  @Column({ default: false })
  auto_user_approval: boolean;

  @Column({ type: "int", default: 365 })
  data_retention_days: number;

  @Column({ nullable: true })
  image_url?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateTenantId() {
    if (!this.tenant_id) {
      this.tenant_id = generateUuidV7();
    }
  }
}
