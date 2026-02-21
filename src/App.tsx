import { Card, Space, Button, Flex } from "antd"; // 1. 导入 Card 组件
import { useState, useEffect } from "react";
import localforage from "localforage";
import tryList from "./assets/try_data.ts";
import juniorList from "./assets/junior_data.ts";
import seniorList from "./assets/senior_data.ts";
import wordList from "./assets/data_json.ts";
import allWordList from "./assets/data_all_word.ts";
const App: React.FC = () => {
  // 定义一个通用的 JSON 类型
  type JsonObject = Record<string, any>;
  // 1. 定义对象的结构
  interface TranslationsItem {
    translation: string; // 对应 "能力，能耐；才能"
    type: string; // 对应 "n" (词性)
  }

  interface storedWord {
    word: string;
    translations: string;
  }
  const [wordIndex, setWordIndex] = useState<number>(0); // 定义状态
  const [word, setWord] = useState<string>(); // 定义状态，默认值可以是空数组或 null
  const [translations, setTranslations] = useState<string>();
  const [translationsArr, setTranslationsArr] = useState<TranslationsItem[]>();
  const [nextOneDisable, setNextOneDisable] = useState<boolean>(false);

  const nextOne = async () => {
    try {
      setNextOneDisable(true);
      const storedData: storedWord | null = await juniorDB.getItem(
        wordIndex.toString(),
      );
      let translations_arr: TranslationsItem[] = [];
      // 2. 判断数据是否存在
      if (storedData) {
        console.log("X:", typeof storedData["translations"]);
        // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
        setWord(storedData["word"]);
        setWordIndex(wordIndex + 1);
        // vs code prompt type error, this is strict ensure type correct
        if (Array.isArray(storedData["translations"])) {
          translations_arr = storedData["translations"];
        }
        setTranslationsArr(translations_arr);
        // let utteranceWord = new SpeechSynthesisUtterance(storedData["word"]),
        //   utteranceWord.lang = "en-US"
        //   utteranceWord.volume = 1;
        setTimeout(() => {
          //发音
          speechSynthesis.speak(
            new SpeechSynthesisUtterance(storedData["word"]),
          );
        }, 500);

        setTimeout(() => {
          setNextOneDisable(false);
        }, 1000);
        // setTranslations(connectTranslations(translations_arr));
      } else {
        // 如果没有数据，可以设置默认值或者保持为空
        setWord("");
        console.log("not word found");
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
  function connectTranslations(translations: TranslationsItem[]): string {
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
          return juniorDB.setItem((parseInt(key) + 1).toString(), {
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
    importJsonData(tryList);
  };
  const importDataAll = () => {
    importJsonDataAll();
  };
  const getWord = () => {
    getData();
  };
  useEffect(() => {
    // 执行读取
    nextOne();
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

  // --- 1. 定义存储函数 ---
  const saveAudioToDB = async () => {
    try {
      let audioBlob: Blob;
      // 1. 获取音频文件 (假设 1.mp3 在 public 目录下，可通过根路径访问)
      await fetch("/a.mp3") // 如果在 src 同级目录或 public 下
        .then((response) => response.blob())
        .then((blob) => {
          console.log(blob instanceof Blob, blob);
          audioBlob = blob;
          localforage.setItem("a_mp3", audioBlob);
        });

      // console.log(audioBlob);
      // 3. 存入 LocalForage
      // 第一个参数是键名（你自己定义），第二个参数是刚才获取的 Blob 数据
      // await localforage.setItem("a_mp3", audioBlob);

      console.log("🎉 1.mp3 已成功存入数据库");
    } catch (error) {
      console.error("💾 存储失败:", error);
    }
  };

  // --- 2. 定义读取并播放函数 ---
  const playAudioFromDB = async () => {
    try {
      // 1. 从数据库取出数据
      const blob: Blob | null = await localforage.getItem("a_mp3");

      if (!blob) {
        alert("数据库中没有找到该文件");
        return;
      }

      // 2. 创建临时 URL 供 Audio 标签使用
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      // 3. 播放 (注意：浏览器要求播放必须由用户点击触发)
      audio.play().catch((err) => {
        console.error("播放被阻止:", err);
        alert("请先点击页面任意位置，再尝试播放");
      });

      // 可选：播放结束后释放内存 (这里简化处理，实际可能需要监听 ended 事件)
      // audio.onended = () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error("播放失败:", err);
    }

    setTimeout(() => {
      // speechSynthesis.speak(new SpeechSynthesisUtterance("the time is over"));
    }, 500);
  };

  return (
    <>
      <div
        style={{
          height: "100vh",
          padding: 16,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Card
          title="初中单词"
          actions={[
            // 通常放按钮或带点击事件的元素
            <Button type="primary" key="unknownWord">
              加入学习
            </Button>,
            <Button
              type="primary"
              key="showTranslations"
              // style={{ backgroundColor: "#ffe8cc" }}
            >
              显示中文
            </Button>,
            <Button
              type="primary"
              key="next"
              disabled={nextOneDisable}
              onClick={nextOne}
            >
              下一个
            </Button>,
          ]}
          style={{
            width: 300,
            height: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",

            borderColor: "#4096FF",
            backgroundColor: "#E6F4FF",
          }}
          // ✅ 新版 antd 推荐：用 styles 代替 bodyStyle
          styles={{
            header: {
              background: "#1677ff", // 顶部蓝色
              color: "#fff",
              fontSize: "16px",
              fontWeight: 500,
            },
            body: {
              flex: 1,
              overflowY: "auto", // 内容内部滚动
              padding: "16",
            },
            actions: {
              backgroundColor: "#fafafa",
              borderTop: "1px solid #e8e8e8",
            },
          }}
        >
          <p style={{ fontSize: 22, fontWeight: 500 }}>{word}</p>
          {/* 使用可选链 (Optional Chaining) */}
          {translationsArr?.map((item, index) => (
            <p key={index}>
              {item.translation} {item.type}
            </p>
          ))}
        </Card>
      </div>

      <Space>
        <Flex gap="small" wrap>
          {/* 点击按钮存入 MP3 */}
          <button onClick={saveAudioToDB}>存储 1.mp3 到数据库</button>

          {/* 点击按钮播放 MP3 */}
          <button onClick={playAudioFromDB}>播放数据库中的 1.mp3</button>
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
