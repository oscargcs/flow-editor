export interface ComponentOption {
    id: string;
    label: string;
}

export interface GroupedComponentOptions {
    consumer: ComponentOption[];
    service: ComponentOption[];
    producer: ComponentOption[];
}
