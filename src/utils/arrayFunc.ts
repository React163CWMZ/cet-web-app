export function arrayDiff<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

/**
 * 打乱数组（纯函数，不修改原数组）
 */
export function arrayShuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Empty of arr return false, or return true
export function isArrayNonEmpty<T>(arr: T | null | undefined): boolean {
  return Array.isArray(arr) && arr.length > 0;
}
