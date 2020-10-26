export type AnyGeneratedMember =
  | GeneratedTypeMember
  | GeneratedFunctionMember
  | GeneratedExpressionMember
  | GeneratedTypeArgumentMember;

export type GeneratedTypeMember = {
  type: 'type';
  name: string;
  declaration: string;
  dependsOn: string[];
  imports?: string[];
};

export type GeneratedFunctionMember = {
  type: 'function';
  name: string;
  declaration: string;
  dependsOn: string[];
  imports?: string[];
};

export type GeneratedExpressionMember = {
  type: 'expression';
  definition: string;
  dependsOn: string[];
  imports?: string[];
};

export type GeneratedTypeArgumentMember = {
  type: 'typeArgument';
  definition: string;
  dependsOn: string[];
  imports?: string[];
};
