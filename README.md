## Description
A full-stack app to create, list, edit and delete **flows**, each made of one consumer, one or more services, and one producer, picked from a set of predefined component definitions (JSON files).

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: Angular 21 (standalone components, signals, Reactive Forms) + Angular Material

## Project setup

### Prerequisites
- Node.js 20+ and npm
- Docker (for PostgreSQL) — or a local PostgreSQL instance

## Compile and run the project

## Backend

Open your docker Desktop and run docker-compose up -d in the /backend folder.

```bash
$ npm install

# development
$ npm start

# production mode
$ npm start:prod
```

## Frontend
```bash
$ npm install

# development
$ npm start
```
This serves the Angular app on http://localhost:4200, calling the API at http://localhost:3000

## The database I chose, and why

PostgreSQL, via TypeORM, storing each Flow as a single row with consumer/producer/services as jsonb columns.

The shape of a flow's consumer/producer/service ({ id, config }) is variable per component type. Modeling that with normalized relational tables (one table per component type, or a generic EAV schema) would add a lot of complexity for no real benefit at this scale.

-MongoDB does not have any schema or relations, schema_validation out of the box.
-PostgreSQL is more user-friendly and has more features than MySQL.

## How I interpreted and used the component definitions

-challenge-library.json provides, per category (consumer / services / producer), an index (consumer_index, services_index, producer_index) mapping a component id to its metadata: name (display label), type (the schema file to load), hidden, deprecated, description.
-Each *Type.json (e.g. myesb-cron-consumerType.json) is the field schema for one component type: a map of field id → { name, type, use, description, appinfo: { fieldType, label, defaultValue, ... } }.
-The backend never exposes type/category to the frontend — the frontend only ever deals with a component's id. The backend resolves id → type → schema file internally (ComponentDefinitionsService).

-For each field, the backend derives a single normalized ComponentConfigurationField:
--type: field.type, falling back to field.appinfo.fieldType when empty (see note on JSON gaps below).
--label: field.appinfo.label, falling back to field.name when empty.
--required: field.use === 'required'.
--defaultValue: parsed from field.appinfo.defaultValue (a string in the JSON), converted to a real boolean when type === 'boolean'.

-All fields of a schema are returned (no filtering), including nested/complex ones like exception-handling or meta-data — the frontend renders every field as either a checkbox (boolean) or a text input (anything else), even if a more specific widget would be a better fit for some of them.

## Assumptions

-All configuration field values are stored/sent as either string or boolean — there was no evidence in the provided JSONs of other primitive field types actually being used, so the UI only implements those two.
(there are non-primitive types like metaData, exceptionHandling which should be adressed in future work).
-The component definitions do not change while the app is running — the backend loads challenge-library.json once at startup.

## How validation is handled

-Backend: class-validator/class-transformer DTOs (CreateFlowDto/UpdateFlowDto) validate the request shape (name required, consumer/producer required objects with id, services optional array). A global ValidationPipe (whitelist, forbidNonWhitelisted, transform) rejects unknown/malformed payloads. Additionally, FlowService checks that every submitted id actually exists in the component definitions (hasComponent), and that the flow name is unique, returning 400/409 accordingly.
-Frontend: 
  1. A single root Angular Reactive Form (FlowFormService) holds name, consumer/producer (nested groups with id + one control per configuration field), and services (a FormArray of the same shape). Each configuration field control gets Validators.required when the field's schema says use: "required". Field-level errors show inline (under each input, e.g. "Name is required.") once a field is touched/dirty.
  2. There are general messages for the whole form above the Save button ("Missing required fields" and "Flow name already exists") .

## What was simplified, stubbed, or left unfinished

-Services should be ordered and usable more than once. The backend is ready for it, but changes in the frontend are required:

1. Create a custom multiple-select that allows order and repetition.
2. Add a new id to ComponentConfigPanel to identify repeated services.

## What I would improve with more time

-Proper handling of non-primitive field types instead of falling back to plain text inputs.
-Proper environment configuration for the frontend's API base URL (environment.ts).
-Server-side pagination/search for the flows list.
-Improve confirmation pop-up styles.
-Code refactors (non-primitive types related code simplifications, folder structure, style consistency). 
-Tests.

## Whether and how I used AI tools

-General file for Copilot copilot-instructions.md, with strict TypeScript, standalone components, signals, Reactive Forms, and other best practices.
-Iterative code generation with Copilot, with manual review and refactoring of the generated code.

## A note on the provided JSON definitions

*Type.json

-type is sometimes empty, with the real type actually living in appinfo.fieldType instead (e.g. autostart in myesb-cron-consumerType.json has "type": "" and "appinfo": { "fieldType": "boolean" }).
-use is a string ("optional" / "required") where a plain boolean (e.g. "required": true) would be simpler to consume and remove the string-comparison (field.use === 'required') currently needed on the backend.
-Services could be displayed in 2 columns in flow-create.

