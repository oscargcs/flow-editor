import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DeleteResult, Repository} from 'typeorm';
import {Flow} from '@app/flow/entity/flow.entity';
import {CreateFlowDto, FlowComponentDto} from './dto/create-flow-dto';
import {UpdateFlowDto} from './dto/update-flow-dto';
import {ComponentDefinitionsService} from '@app/component-definitions/component-definitions.service';
import {ComponentType} from "@app/types/component-type-enum";
import {FlowComponent} from "@app/types/flow-component";
import {FlowComponentSummary, FlowSummary} from './types/flow-summary';
import {FlowDetail, FlowDetailComponent} from './types/flow-detail';
import {ComponentConfigurationField} from '@app/component-definitions/types/component-configuration-field';

@Injectable()
export class FlowService {
    constructor(@InjectRepository(Flow)
                private readonly repo: Repository<Flow>,
                private readonly componentDefs: ComponentDefinitionsService) {
    }

    async create(createFlowDto: CreateFlowDto): Promise<Flow> {
        // Check for duplicate name
        const exists: Flow | null = await this.repo.findOne({where: {name: createFlowDto.name}});
        if (exists) throw new ConflictException('Flow name already exists');

        // Validate component IDs exist in definitions
        this.validateFlowComponent(createFlowDto);

        const flow: Flow = this.repo.create(createFlowDto);
        return await this.repo.save(flow);
    }

    async findAll(): Promise<FlowSummary[]> {
        const flows: Flow[] = await this.repo.find();
        return flows.map((flow: Flow): FlowSummary => this.toFlowSummary(flow));
    }

    private toFlowSummary(flow: Flow): FlowSummary {
        return {
            id: flow.id,
            name: flow.name,
            consumer: this.toComponentSummary(flow.consumer),
            services: flow.services.map(
                (service: FlowComponent): FlowComponentSummary => this.toComponentSummary(service),
            ),
            producer: this.toComponentSummary(flow.producer),
        };
    }

    private toComponentSummary(component: FlowComponent): FlowComponentSummary {
        return {
            name: this.componentDefs.getComponentName(component.id),
            description: this.componentDefs.getComponentDescription(component.id),
        };
    }

    async findOne(id: string): Promise<FlowDetail> {
        const flow: Flow = await this.findEntity(id);
        return this.toFlowDetail(flow);
    }

    private async findEntity(id: string): Promise<Flow> {
        const flow: Flow | null = await this.repo.findOne({where: {id}});
        if (flow === null) throw new NotFoundException('Flow not found');
        return flow;
    }

    private toFlowDetail(flow: Flow): FlowDetail {
        return {
            id: flow.id,
            name: flow.name,
            consumer: this.toDetailComponent(flow.consumer),
            services: flow.services.map((service: FlowComponent) => this.toDetailComponent(service)),
            producer: this.toDetailComponent(flow.producer),
        };
    }

    private toDetailComponent(component: FlowComponent): FlowDetailComponent {
        const fields: ComponentConfigurationField[] = this.componentDefs.getComponentConfiguration(component.id) ?? [];
        return {
            id: component.id,
            label: this.componentDefs.getComponentName(component.id),
            config: this.componentDefs.getNormalisedConfig(component.config, fields),
            fields,
        };
    }

    async update(id: string, updateFlowDto: UpdateFlowDto): Promise<Flow> {
        const flow: Flow = await this.findEntity(id);

        // Check for duplicate name if changed
        if (updateFlowDto.name && updateFlowDto.name !== flow.name) {
            const exists: Flow | null = await this.repo.findOne({where: {name: updateFlowDto.name}});
            if (exists) throw new ConflictException('Flow name already exists');
        }

        this.validateFlowComponent(updateFlowDto);

        Object.assign(flow, updateFlowDto);
        return await this.repo.save(flow);
    }

    private validateComponentId(
        type: ComponentType,
        component: FlowComponentDto,
    ): void {
        if (!this.componentDefs.hasComponent(type, component.id)) {
            throw new BadRequestException(
                `Unknown ${type} component: ${component.id}`,
            );
        }
    }

    private validateFlowComponent(dto: CreateFlowDto | UpdateFlowDto): void {
        if (dto.consumer) {
            this.validateComponentId(ComponentType.CONSUMER, dto.consumer);
        }

        if (dto.services) {
            dto.services.forEach(service =>
                this.validateComponentId(ComponentType.SERVICE, service),
            );
        }

        if (dto.producer) {
            this.validateComponentId(ComponentType.PRODUCER, dto.producer);
        }
    }

    async remove(id: string): Promise<void> {
        const res: DeleteResult = await this.repo.delete(id);
        if (res.affected === 0) throw new NotFoundException('Flow not found');
    }
}



