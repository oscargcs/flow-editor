import {Injectable, Logger} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {ComponentType} from "@app/types/component-type-enum";
import {ComponentOption, GroupedComponentOptions} from "@app/component-definitions/types/component-options";
import {ComponentIndexEntry} from "@app/component-definitions/types/component-index-entry";
import {ChallengeLibrary, ComponentIndex} from "@app/component-definitions/types/challenge-library";
import {ComponentConfigurationField} from "@app/component-definitions/types/component-configuration-field";
import {RawConfigurationField, RawConfigurationSchema} from "@app/component-definitions/types/raw-configuration-field";

@Injectable()
export class ComponentDefinitionsService {
  private readonly logger: Logger = new Logger(ComponentDefinitionsService.name);
  private readonly jsonsPath: string = path.join(process.cwd(), '..');
  private definitions: ChallengeLibrary;

  constructor() {
    this.loadDefinitions();
  }

  private loadDefinitions(): void {
    const filePath: string = path.join(this.jsonsPath, 'challenge-library.json');
    try {
      const raw: string = fs.readFileSync(filePath, { encoding: 'utf8' });
      this.definitions = JSON.parse(raw);
      this.logger.log('Loaded component definitions from' + filePath);
    } catch (err) {
      this.logger.error('Failed to load component definitions from' + filePath, err);
      throw new Error('Unable to load challenge-library.json');
    }
  }

  getOptions(category: ComponentType): ComponentOption[] {
    const idx: ComponentIndex = this.getIndex(category);
    if (!idx) return [];

    return Object.values(idx)
      .filter((entry: ComponentIndexEntry) => !entry.hidden && !entry.deprecated)
      .map((entry: ComponentIndexEntry) => ({
        id: entry.id,
        label: entry.name,
      }));
  }

  getAllOptions(): GroupedComponentOptions {
    return {
      consumer: this.getOptions(ComponentType.CONSUMER),
      service: this.getOptions(ComponentType.SERVICE),
      producer: this.getOptions(ComponentType.PRODUCER),
    };
  }

  /** Return the configuration fields for a component, found by its id (not its type). */
  getComponentConfiguration(componentId: string): ComponentConfigurationField[] | null {
    const type: string = this.getTypeById(componentId);
    if (!type) return null;

    const schema: RawConfigurationSchema | null = this.getComponentConfigurationByType(type);
    if (!schema) {
      this.logger.warn(`Configuration not found for type ${type}`);
      return null;
    }

    return this.toConfigurationFields(schema);
  }

  getRaw(): ChallengeLibrary {
    return this.definitions;
  }

  private getComponentConfigurationByType(typeId: string): RawConfigurationSchema | null {
    try {
      const p: string = path.join(this.jsonsPath, `${typeId}.json`);
      const raw: string = fs.readFileSync(p, { encoding: 'utf8' });
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error(`Failed to load configuration for type ${typeId}`, err);
      return null;
    }
  }

  /** Convert the raw *Type.json schema into the fields the frontend can render. */
  private toConfigurationFields(schema: RawConfigurationSchema): ComponentConfigurationField[] {
    return Object.entries(schema).map(
      ([fieldId, field]: [string, RawConfigurationField]): ComponentConfigurationField =>
        this.toConfigurationField(fieldId, field),
    );
  }

  private toConfigurationField(fieldId: string, field: RawConfigurationField): ComponentConfigurationField {
    const type: string = field.type || field.appinfo.fieldType || '';

    return {
      id: fieldId,
      label: field.appinfo.label || field.name,
      type,
      required: field.use === 'required',
      defaultValue: this.parseDefaultValue(field.appinfo.defaultValue, type),
      description: field.description,
    };
  }

  private parseDefaultValue(rawValue: string | undefined, type: string): unknown {
    if (rawValue === undefined) return null;
    if (type === 'boolean') return rawValue === 'true';
    return rawValue;
  }

  /**gets Config with saved (raw) or default values in the right format **/
  getNormalisedConfig(config: Record<string, unknown>, fields: ComponentConfigurationField[]): Record<string, unknown> {
    return Object.fromEntries(
        fields.map((field: ComponentConfigurationField): [string, unknown] => [
          field.id,
          this.getNormalisedConfigValue(config?.[field.id], field),
        ]),
    );
  }

// TODO: This logic can be removed if we store real booleans instead of "true"/"false" strings.
  private getNormalisedConfigValue(savedValue: unknown, field: ComponentConfigurationField): unknown {
    if (field.type === 'boolean') return this.getNormalisedBoolean(savedValue ?? field.defaultValue ?? false);
    return savedValue != null ? String(savedValue) : (field.defaultValue ?? '');
  }

  /** Parse a boolean out of a real boolean or a "true"/"false" string; `null` if it can't be determined. */
  private getNormalisedBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }

  /** Return the index object for a given category key */
  getIndex(category: ComponentType): ComponentIndex {
    switch (category) {
      case ComponentType.CONSUMER:
        return this.definitions.consumer_index;
      case ComponentType.SERVICE:
        return this.definitions.services_index;
      case ComponentType.PRODUCER:
        return this.definitions.producer_index;
    }
  }

  hasComponent(category: ComponentType, id: string): boolean {
    const idx: ComponentIndex = this.getIndex(category);
    if (!idx) return false;
    return Object.prototype.hasOwnProperty.call(idx, id);
  }

  /** Pass a componentId to get a componentType */
  private getTypeById(componentId: string): string  {
    for (const category of Object.values(ComponentType)) {
      const idx: ComponentIndex = this.getIndex(category);
      const entry: ComponentIndexEntry = idx?.[componentId];
      if (entry) return entry.type;
    }
    return '';
  }
  /** Display name (label) for a component, found by its id across all categories. */
  getComponentName(componentId: string): string {
    for (const category of Object.values(ComponentType)) {
      const idx: ComponentIndex = this.getIndex(category);
      const entry: ComponentIndexEntry = idx?.[componentId];
      if (entry) return entry.name;
    }
    this.logger.warn(`Component name not found for id ${componentId}`);
    return 'Unknown';
  }

  /** Description for a component, found by its id across all categories. */
  getComponentDescription(componentId: string): string {
    for (const category of Object.values(ComponentType)) {
      const idx: ComponentIndex = this.getIndex(category);
      const entry: ComponentIndexEntry = idx?.[componentId];
      if (entry) return entry.description;
    }
    return '';
  }
}
