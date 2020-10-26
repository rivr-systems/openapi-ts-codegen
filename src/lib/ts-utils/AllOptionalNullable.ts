export type AllOptionalNullable<T> = {
  [K in keyof T]?: T[K] extends object
    ? AllOptionalNullable<T[K]>
    : T[K] | null;
};
