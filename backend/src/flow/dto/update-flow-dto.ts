import { PartialType } from '@nestjs/mapped-types';
import { CreateFlowDto } from "@app/flow/dto/create-flow-dto";

export class UpdateFlowDto extends PartialType(CreateFlowDto) {}
