export enum ComponentType {
    CONSUMER = 'consumer',
    SERVICE = 'service',
    PRODUCER = 'producer'
}

export function isComponentType(value: string): boolean {
    return Object.values(ComponentType).includes(value as ComponentType);
}
