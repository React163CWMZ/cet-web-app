import localforage from "localforage";

const useLocalforageDb = (dbName: string, storeName: string) => {
  // 单词数据库：MyDb
  const myDb = localforage.createInstance({
    name: dbName, //数据库名
    storeName: storeName, // 类似于表名
  });
  return myDb;
};

export default useLocalforageDb;
