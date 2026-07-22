import {Controller, Get, NotFoundException, Param} from '@nestjs/common';
import {ComponentDefinitionsService} from './component-definitions.service';
import {ComponentType, isComponentType} from "@app/types/component-type-enum";
import {GroupedComponentOptions} from "@app/component-definitions/types/component-options";
import {ChallengeLibrary, ComponentIndex} from "@app/component-definitions/types/challenge-library";
import {ComponentConfigurationField} from "@app/component-definitions/types/component-configuration-field";

@Controller('component-definitions')
export class ComponentDefinitionsController {
  constructor(private readonly componentDefinitionsService: ComponentDefinitionsService) {}

  @Get()
  getAll(): ChallengeLibrary {
    return this.componentDefinitionsService.getRaw();
  }

  @Get('options')
  getAllOptions(): GroupedComponentOptions {
    return this.componentDefinitionsService.getAllOptions();
  }

  @Get('configuration/:componentId')
  getConfiguration(@Param('componentId') componentId: string): ComponentConfigurationField[] {
    const configuration = this.componentDefinitionsService.getComponentConfiguration(componentId);
    if (!configuration) throw new NotFoundException('Component configuration not found');
    return configuration;
  }

  @Get('index/:category')
  getIndex(@Param('category') category: string): ComponentIndex {
    if (!isComponentType(category)) throw new NotFoundException('Unknown category');
    const idx: ComponentIndex | null = this.componentDefinitionsService.getIndex(category as ComponentType);
    if (!idx) throw new NotFoundException('No index for category');
    return idx;
  }
}
