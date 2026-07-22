import {ComponentConfigurationField} from '@app/component-definitions/types/component-configuration-field';

/** A flow component enriched with its display label and configuration field definitions, so the frontend can render its panel without an extra round-trip. */
export interface FlowDetailComponent {
  id: string;
  label: string;
  config: Record<string, unknown>;
  fields: ComponentConfigurationField[];
}

/** Shape returned by GET /flow/:id, used to prefill the edit form in a single call. */
export interface FlowDetail {
  id: string;
  name: string;
  consumer: FlowDetailComponent;
  services: FlowDetailComponent[];
  producer: FlowDetailComponent;
}


