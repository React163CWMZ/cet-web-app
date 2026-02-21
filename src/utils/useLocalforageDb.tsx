import localforage from "localforage";
interface storedWord {
  word: string;
  translations: string;
}
const useLocalforageDb = (dbName: string, storeName: string) => {
  // 单词数据库：MyDb
  const myDb = localforage.createInstance({
    name: dbName, //数据库名
    storeName: storeName, // 类似于表名
  });
  return myDb;
};

export async function getOneData<T>(Db: LocalForage) {
  let result: T | null = null;
  try {
    // 这里的代码会“等待”遍历完成
    result = await Db.getItem("1");

    return result; // 数据拿到后再执行后续逻辑
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
