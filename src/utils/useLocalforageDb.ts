import localforage from "localforage";

const useLocalforageDb = (dbName: string, storeName: string) => {
  // 单词数据库：MyDb
  const myDb = localforage.createInstance({
    name: dbName, //数据库名
    storeName: storeName, // 类似于表名
  });
  return myDb;
};

export async function getOneDataByKey<T>(Db: LocalForage, key: string) {
  let result: T | null = null;
  try {
    result = await Db.getItem(key);

    return result; // 数据拿到后再执行后续逻辑
  } catch (err) {
    console.error("读取失败", err);
  }
}

export async function setOneDataByKey(
  Db: LocalForage,
  key: string,
  value: unknown,
) {
  try {
    await Db.setItem(key, value);

    return true;
  } catch (err) {
    console.error("写入失败", err);
    return false;
  }
}

export async function getOneData(Db: LocalForage) {
  try {
    return await Db.getItem("1");
  } catch (err) {
    console.error("读取失败", err);
  }
}

// save one scheme brief to db
export async function saveOneData<T>(Db: LocalForage, obj: T) {
  try {
    await Db.setItem("1", obj);

    console.log("导入成功！");
  } catch (err) {
    console.error("导入失败:", err);
    // 这里可以添加更复杂的错误处理逻辑，例如重试或用户提示
  }
}

// save array to db
export async function saveListData<T>(Db: LocalForage, list: T[]) {
  try {
    await Promise.all(
      list.map((value, index) => {
        return Db.setItem((index + 1).toString(), value);
      }),
    );
    console.log("导入成功！");
  } catch (err) {
    console.error("导入失败:", err);
    // 这里可以添加更复杂的错误处理逻辑，例如重试或用户提示
  }
}

// read from db, save to array
export async function getAllDataFromStore<T>(Db: LocalForage): Promise<T[]> {
  const dataArray: T[] = [];
  // throw new Error("xxcccdata");
  try {
    // 方法一：使用 iterate (推荐，效率高)
    // iterate 接收回调函数，遍历所有键值对
    await Db.iterate((value: T, key: string) => {
      // 将每一条数据构造成对象，推入数组，存入db_key,for update
      dataArray.push({ ...value, db_key: key });

      // 注意：在 iterate 中不能使用 return 来中断（除非抛出异常），它是同步遍历
    });

    // console.log("获取到的数据数组:", dataArray);
    return dataArray;
  } catch (err) {
    console.error("读取数据失败:", err);
    throw new Error((err as Error).message);
  }
}

// 清空 store 下的所有数据
export async function clearStore(Db: LocalForage) {
  try {
    await Db.clear();
    console.log("仓库已清空");
  } catch (err) {
    console.error("清空失败:", err);
  }
}

export default useLocalforageDb;
