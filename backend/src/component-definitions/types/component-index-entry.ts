/** Shape of a single entry inside consumer_index / services_index / producer_index, limited to the fields we actually use. */
export interface ComponentIndexEntry {
    id: string;
    name: string;
    type: string;
    description: string;
    hidden: boolean;
    deprecated: boolean;
}


