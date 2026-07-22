import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FlowService } from './flow.service';
import { CreateFlowDto } from './dto/create-flow-dto';
import { UpdateFlowDto } from './dto/update-flow-dto';
import {Flow} from "@app/flow/entity/flow.entity";
import {FlowSummary} from './types/flow-summary';
import {FlowDetail} from './types/flow-detail';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post()
  async create(@Body() createDto: CreateFlowDto): Promise<Flow> {
    return this.flowService.create(createDto);
  }

  @Get()
  findAll(): Promise<FlowSummary[]> {
    return this.flowService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<FlowDetail> {
    return this.flowService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateFlowDto): Promise<Flow> {
    return this.flowService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.flowService.remove(id);
  }
}

