import {FlowComponent} from './flow.model';

export interface CreateFlowRequest {
  name: string;
  consumer: FlowComponent;
  services?: FlowComponent[];
  producer: FlowComponent;
}

export interface UpdateFlowRequest {
  name?: string;
  consumer?: FlowComponent;
  services?: FlowComponent[];
  producer?: FlowComponent;
}
