import { Card, Space, Button, Flex } from "antd"; // 1. 导入 Card 组件
import { useState, useEffect } from "react";
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

  interface storedWord {
    word: string;
    translations: string;
  }
  const [wordIndex, setWordIndex] = useState<number>(0); // 定义状态
  const [word, setWord] = useState<string>(); // 定义状态，默认值可以是空数组或 null
  const nextOne = async () => {
    console.log("cliked");
    try {
      // let storedData: storedWord | null = { word: "", translations: "" };
      const storedData: storedWord | null = await juniorDB.getItem(
        wordIndex.toString(),
      );

      // 2. 判断数据是否存在
      if (storedData) {
        console.log("X:", storedData["word"]);
        // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
        setWord(storedData["word"]);
        setWordIndex(wordIndex + 1);
      } else {
        // 如果没有数据，可以设置默认值或者保持为空
        setWord("");
      }
    } catch (err) {
      alert("读取失败：" + err);
    }
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
      const storedData: storedWord | null = await juniorDB.getItem(
        wordIndex.toString(),
      );

      // 2. 判断数据是否存在
      if (storedData) {
        // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
        setWord(storedData["word"]);
      } else {
        // 如果没有数据，可以设置默认值或者保持为空
        setWord("");
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
  useEffect(() => {
    // 定义一个异步函数
    const loadData = async () => {
      try {
        // 1. 从 localforage 获取数据
        // getItem 第一个参数是 key
        const storedData: storedWord | null = await juniorDB.getItem("0");

        // 2. 判断数据是否存在
        if (storedData) {
          // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
          setWord(storedData["word"]);
          setWordIndex(wordIndex + 1);
        } else {
          // 如果没有数据，可以设置默认值或者保持为空
          setWord("");
        }
      } catch (err) {
        // 读取失败（例如浏览器隐私模式）
        console.error("读取失败:", err);
        setWord("");
      } finally {
        // 结束加载状态
        //setLoading(false);
      }
    };

    // 执行读取
    loadData();
  }, []); // 空依赖数组，确保只在组件挂载时执行一次
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
          <p>{word}</p>
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
