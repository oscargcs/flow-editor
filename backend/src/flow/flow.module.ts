import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flow } from '@app/flow/entity/flow.entity';
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { ComponentDefinitionsModule } from '@app/component-definitions/component-definitions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flow]), ComponentDefinitionsModule],
  providers: [FlowService],
  controllers: [FlowController],
  exports: [FlowService],
})
export class FlowModule {}


