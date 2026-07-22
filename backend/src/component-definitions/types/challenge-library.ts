import {ComponentIndexEntry} from "@app/component-definitions/types/component-index-entry";

export interface ChallengeLibrary {
    consumer_index: ComponentIndex;
    services_index: ComponentIndex;
    producer_index: ComponentIndex;
}

export type ComponentIndex = Record<string, ComponentIndexEntry>;
