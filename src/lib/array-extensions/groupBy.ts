import { Index } from './TheIndex';
import { IndexedValue } from './IndexedValue';
import { CreateIndexedObject } from './CreateIndexedObject';

export {};

declare global {
  interface Array<T> {
    groupBy<U>(
      callback: (element: T, index: number, array: T[]) => IndexedValue<U>
    ): Index<U[]>;
    groupBy(
      callback: (element: T, index: number, array: T[]) => string
    ): Index<T[]>;
  }
}

if (!Array.prototype.groupBy) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.groupBy = function groupBy<T, U>(
    this: T[],
    callback: (
      element: T,
      index: number,
      collection: T[]
    ) => string | IndexedValue<U>
  ): Index<(T | U)[]> {
    const ix = this.reduce((memo, element, index, collection) => {
      const r = callback(element, index, collection);
      const key = typeof r === 'string' ? r : r.key;
      const value = typeof r === 'string' ? element : r.value;
      if (typeof memo[key] === 'undefined') {
        return {
          ...memo,
          [key]: [value]
        };
      }
      memo[key].push(value);
      return memo;
    }, {} as { [key: string]: (T | U)[] });
    return CreateIndexedObject(ix);
  };
}
