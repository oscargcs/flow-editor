import { Module } from '@nestjs/common';
import {ComponentDefinitionsController} from "@app/component-definitions/component-definitions.controller";
import {ComponentDefinitionsService} from "@app/component-definitions/component-definitions.service";

@Module({
  providers: [ComponentDefinitionsService],
  controllers: [ComponentDefinitionsController],
  exports: [ComponentDefinitionsService],
})
export class ComponentDefinitionsModule {}
