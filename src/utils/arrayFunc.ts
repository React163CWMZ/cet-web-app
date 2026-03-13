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

// if value is Empty ,return true, or return false
export function isEmpty(value: unknown): boolean {
  // 处理 null 和 undefined
  if (value == null) return true;

  // 处理字符串和数组
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }

  // 处理对象
  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  // 处理boolean
  if (typeof value === "boolean") {
    return value === false;
  }

  return false;
}

// 封装一个延迟函数
/**
 * @desc 在async函数里面使用，await delay(500); // 同步延迟500ms，后面的代码只能等待。
 * @param ms 毫秒
 * @returns
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
