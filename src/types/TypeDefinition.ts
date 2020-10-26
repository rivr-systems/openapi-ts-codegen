export type TypeDefinition = {
  dependencies: string[];
};

export type ReferenceTypeDefinition = TypeDefinition & {
  reference: string;
};

export type BuiltInTypeDefinition = TypeDefinition & {
  builtIn: 'boolean' | 'string' | 'number';
};

export type EnumTypeDefinition = TypeDefinition & {
  enum: string[];
  nullable: boolean;
};

export type LiteralTypeDefinition = TypeDefinition & {
  literal: {
    dependencies: string[];
    properties: {
      name: string;
      type: AnyTypeDefinition;
      required: boolean;
    }[];
  };
};

export type ArrayTypeDefinition = TypeDefinition & {
  array: AnyTypeDefinition;
};

export type CompositeTypeDefinition = TypeDefinition & {
  members: AnyTypeDefinition[];
  type: 'oneOf' | 'allOf';
};

export type AnyTypeDefinition =
  | ReferenceTypeDefinition
  | BuiltInTypeDefinition
  | EnumTypeDefinition
  | LiteralTypeDefinition
  | ArrayTypeDefinition
  | CompositeTypeDefinition;

export const defaultTypeDefinition: AnyTypeDefinition = {
  builtIn: 'string',
  dependencies: []
};
