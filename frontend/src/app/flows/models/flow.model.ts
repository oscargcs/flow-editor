
export interface FlowComponent {
  id: string;
  config: Record<string, any>;
}

export interface Flow {
  id: string;
  name: string;
  consumer: FlowComponent;
  services: FlowComponent[];
  producer: FlowComponent;
  createdAt?: string;
  updatedAt?: string;
}

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

