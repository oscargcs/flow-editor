import {Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn} from 'typeorm';
import {FlowComponent} from "@app/types/flow-component";

@Entity('flow')
@Unique(['name'])
export class Flow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column({ type: 'jsonb' })
  consumer: FlowComponent;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  services: FlowComponent[];

  @Column({ type: 'jsonb' })
  producer: FlowComponent;
}

