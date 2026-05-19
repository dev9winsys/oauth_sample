import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

export enum BlockType {
  WARNING = "warning",
  TEMPORARY_SUSPENSION = "temporary_suspension",
  PERMANENT_BLOCK = "permanent_block",
}

@Entity({ name: "user_block_history" })
@Index(["user_id", "createdAt"])
export class UserBlockHistory {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.blockHistories)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    type: "enum",
    enum: BlockType,
  })
  block_type: BlockType;

  @Column({ type: "varchar", length: 1000, nullable: true })
  reason: string | null;

  @Column({ type: "timestamp", nullable: true })
  block_release_date: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
