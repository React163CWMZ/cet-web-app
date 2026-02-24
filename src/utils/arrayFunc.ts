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

// read from db, save to array
export async function getAllDataFromStore<T>(Db: LocalForage) {
  const dataArray: T[] = []; //groupWord[]

  try {
    // 方法一：使用 iterate (推荐，效率高)
    // iterate 接收回调函数，遍历所有键值对
    await Db.iterate((value: T) => {
      // 将每一条数据构造成对象，推入数组

      dataArray.push(value);

      // 注意：在 iterate 中不能使用 return 来中断（除非抛出异常），它是同步遍历
    });

    // console.log("获取到的数据数组:", dataArray);
    return dataArray;
  } catch (err) {
    console.error("读取数据失败:", err);
  }
}
