import { FlowComponent } from "@app/types/flow-component";
import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class FlowComponentDto implements FlowComponent {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  config: Record<string, unknown>;
}

export class CreateFlowDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FlowComponentDto)
  consumer: FlowComponentDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowComponentDto)
  services?: FlowComponentDto[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FlowComponentDto)
  producer: FlowComponentDto;
}
