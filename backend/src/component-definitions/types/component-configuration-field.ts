/** A single configurable field for a component, ready to be rendered by the frontend. */
export interface ComponentConfigurationField {
    id: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue: unknown;
    description: string;
}

