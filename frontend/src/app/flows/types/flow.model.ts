export interface FlowComponent {
  id: string;
  config: Record<string, unknown>;
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

