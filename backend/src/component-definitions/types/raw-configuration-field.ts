/** appinfo block of a raw configuration field, as found in the *Type.json files. */
export interface RawConfigurationFieldAppInfo {
    fieldType?: string;
    label?: string;
    defaultValue?: string;
}

/** Shape of a single field entry inside a *Type.json configuration file. */
export interface RawConfigurationField {
    name: string;
    type: string;
    use: string;
    description: string;
    appinfo: RawConfigurationFieldAppInfo;
}

/** A *Type.json file is a map of field id -> RawConfigurationField. */
export type RawConfigurationSchema = Record<string, RawConfigurationField>;

