import { Card, Space, Button, Flex } from "antd"; // 1. 导入 Card 组件
import localforage from "localforage";
import juniorList from "./assets/junior_data.ts";
import seniorList from "./assets/senior_data.ts";
import wordList from "./assets/data_json.ts";
import allWordList from "./assets/data_all_word.ts";
const App: React.FC = () => {
  // 定义一个通用的 JSON 类型
  type JsonObject = Record<string, any>;
  // 1. 定义对象的结构
  interface WordItem {
    translation: string; // 对应 "能力，能耐；才能"
    type: string; // 对应 "n" (词性)
  }
  const nextOne = () => {
    console.log("cliked");
  };
  // 单词数据库：MyDb
  const juniorDB: LocalForage = localforage.createInstance({
    name: "MyDb", //数据库名
    storeName: "juniorStore", // 类似于表名
  });
  // 单词数据库：MySenior
  const allWordDB = localforage.createInstance({
    name: "AllWORD", //数据库名
    storeName: "wordStore", // 类似于表名
  });
  // 中文释义
  function connectTranslations(translations: WordItem[]): string {
    let str: string = "";
    for (const value of translations) {
      console.log(value.translation, value.type);
      str += value.translation + " " + value.type;
    }
    return str;
  }

  async function importJsonData(List: JsonObject) {
    try {
      console.log("import data");

      const entries = Object.entries(List);
      await Promise.all(
        entries.map(([key, value]) => {
          return juniorDB.setItem(key, {
            word: value["word"],
            translations: value["translations"],
          });
        }),
      );
      console.log("导入成功！");
    } catch (err) {
      console.error("导入失败:", err);
    }
  }

  async function importJsonDataAll() {
    try {
      console.log("import all data");

      const entries = Object.entries(allWordList);
      console.log(entries);
      // await Promise.all(
      //   entries.map(([key, value]) => {
      //     return allWordDB.setItem(key, value);
      //   }),
      // );
      console.log("导入成功！");
    } catch (err) {
      console.error("导入失败:", err);
    }
  }

  async function getData() {
    try {
      const data = await juniorDB.getItem("sweet");
      if (data) {
        alert("读取到数据：\n" + JSON.stringify(data, null, 2));
      } else {
        alert("未读取到数据（可能未保存或已删除）");
      }
    } catch (err) {
      alert("读取失败：" + err);
    }
  }

  // 生成单词json，用于刷新需要下载音频的单词
  function createJson() {
    try {
      const entries = Object.entries(seniorList);
      let myArr: Array<string> = [];
      let myJson: any;
      entries.map(([key, value]) => {
        myArr.push(value["word"]);
      });
      console.log("create json 成功！");
      console.log(myArr);
      myJson = JSON.stringify(myArr);
      console.log(myJson);

      getNeedWord(myArr);
    } catch (err) {
      console.error("create json 失败:", err);
    }
  }

  // attain necessary word voice url
  function getNeedWord(data: Array<string>) {
    try {
      type RecordType = {
        [key: string]: string; // 表示键是字符串，值也是字符串
      };
      let myArr: RecordType[] = [];
      let myArrData: Array<string> = []; //有语音的单词
      let myJson: any;
      let obj2: RecordType = {};
      let obj: RecordType;
      const entries = Object.entries(allWordList);
      entries.map(([key, value]) => {
        if (data.includes(key)) {
          obj2[key] = value;
          // obj = { [key]: value };
          // myArr.push(obj);
          myArrData.push(key);
        }
      });
      console.log(arrayDifference(data, myArrData));
      myJson = JSON.stringify(obj2);
      console.log("获取需要的单词:", myJson);
    } catch (err) {
      console.error("获取需要的单词 失败:", err);
    }
  }
  // filter word which arr1 has  ，but arr2 not has 。
  function arrayDifference<T>(arr1: T[], arr2: T[]): T[] {
    return arr1.filter((x) => !arr2.includes(x));
  }

  const importData = () => {
    importJsonData(juniorList);
  };
  const importDataAll = () => {
    importJsonDataAll();
  };
  const getWord = () => {
    getData();
  };
  return (
    <>
      <Space vertical size={16}>
        <Card
          style={{
            width: 300,
            borderColor: "#4096FF",
            backgroundColor: "#E6F4FF",
          }}
        >
          <p>Card content</p>
          <p>Card content</p>
          <p>Card content</p>
        </Card>

        <Flex gap="small" wrap>
          <Button type="primary">显示意思</Button>
          <Button onClick={nextOne} type="primary">
            下一个
          </Button>
        </Flex>
      </Space>
      <Space vertical size={16}>
        <Button onClick={importData}>导入数据</Button>
        <Button onClick={getWord}>得到数据</Button>
        <Button
          onClick={() => {
            createJson();
          }}
        >
          create json
        </Button>
        <Button onClick={importDataAll}>导入All数据</Button>
      </Space>
    </>
  );
};

export default App;
