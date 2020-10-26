/* eslint-disable no-restricted-syntax */
export {};

declare global {
  interface Array<T> {
    max(
      callback: (element: T, index: number, array: T[]) => number
    ): number | null;
  }
}

if (!Array.prototype.max) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.max = function sum<T>(
    this: T[],
    callback: (element: T, index: number, array: T[]) => number
  ): number | null {
    let max: number | null = null;
    this.forEach((element, index) => {
      const t = callback(element, index, this);
      if (max === null || max < t) {
        max = t;
      }
    });
    return max;
  };
}
