import { Card, Space, Button, Flex, Typography } from "antd"; // 1. 导入 Card 组件
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import localforage from "localforage";
import juniorList from "./assets/junior_data.ts";
import seniorList from "./assets/senior_data.ts";
import allWordList from "./assets/data_all_word.ts";
import useLocalforageDb, { clearStore } from "./utils/useLocalforageDb.ts";
import { getAllDataFromStore, isArrayNonEmpty } from "./utils/arrayFunc.ts";

const { Title } = Typography;

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
// word data with group
interface groupWord {
  group: number;
  word: string;
  index?: number;
}
const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  //解构参数（加类型注解更规范）
  const { group } = location.state || {};

  const currentGroup: number = group;

  const [wordIndex, setWordIndex] = useState<number>(1); // 定义状态
  const [word, setWord] = useState<string>(); // 定义状态，默认值可以是空数组或 null
  // const [translations, setTranslations] = useState<string>();
  const [translationsArr, setTranslationsArr] = useState<TranslationsItem[]>();
  const [nextOneDisable, setNextOneDisable] = useState<boolean>(false);
  const [preOneDisable, setPreOneDisable] = useState<boolean>(false);

  const [wordData, setWordData] = useState<groupWord[]>([]);
  const preWordRef = useRef<number>(1);

  const juniorDbRef = useRef(useLocalforageDb("MyDb", "juniorStore"));
  const juniorGroupDbRef = useRef(useLocalforageDb("MyDb", "juniorGroup"));

  // 倒计时数字
  const [count, setCount] = useState(1);
  // 是否结束倒计时
  const [isCountFinish, setIsCountFinish] = useState(false);

  // get group words which need to learn
  const getGroupWords = () => {
    getAllDataFromStore(juniorGroupDbRef.current).then((data) => {
      if (data) {
        data = (data as groupWord[]).filter(
          (item) => item.group == currentGroup,
        );

        data = (data as groupWord[]).map((item, idx) => ({
          ...item, // 展开原有的所有属性
          index: idx + 1, // 添加 index，从 1 开始
        }));
        // console.log(data);
        setWordData(data as groupWord[]);
      }
    });
  };
  const preOne = async () => {
    preOnefromArray();
  };
  const nextOne = async () => {
    nextOnefromArray();
  };
  const nextOnefromArray = async () => {
    try {
      setNextOneDisable(true);

      if (wordIndex > wordData.length) {
        throw new Error("已到达最后一个");
      }
      let needWord = wordData.filter((item) => item.index === wordIndex);

      if (!isArrayNonEmpty(needWord)) {
        throw new Error("未找到单词");
      }
      // current word index, make pre or next
      preWordRef.current = (needWord[0]["index"] as number) - 1;
      setWordIndex((needWord[0]["index"] as number) + 1);
      const storedData: storedWord | null = await juniorDbRef.current.getItem(
        needWord[0]["word"],
      );
      // console.log("333==", wordData, needWord, wordIndex, storedData);

      let translations_arr: TranslationsItem[] = [];
      // 2. 判断数据是否存在
      if (storedData) {
        // console.log("X:", typeof storedData["translations"]);
        // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
        setWord(storedData["word"]);

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
      if (err == "Error: 已到达最后一个") {
        navigate("/daytask");
      }
      setNextOneDisable(false);
    }
  };
  const preOnefromArray = async () => {
    try {
      setPreOneDisable(true);
      if (preWordRef.current < 1) {
        console.log(666);
        throw new Error("已到达第一个");
        // needWord is empty
      }
      let needWord = wordData.filter(
        (item) => item.index === preWordRef.current,
      );
      if (!isArrayNonEmpty(needWord)) {
        throw new Error("未找到单词");
      }
      // current word index, make pre or next
      preWordRef.current = (needWord[0]["index"] as number) - 1;
      setWordIndex((needWord[0]["index"] as number) + 1);
      const storedData: storedWord | null = await juniorDbRef.current.getItem(
        needWord[0]["word"],
      );
      console.log("000==", wordData, needWord, wordIndex, storedData);

      let translations_arr: TranslationsItem[] = [];
      // 2. 判断数据是否存在
      if (storedData) {
        console.log("X:", typeof storedData["translations"]);
        // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
        setWord(storedData["word"]);

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
          setPreOneDisable(false);
        }, 1000);
        // setTranslations(connectTranslations(translations_arr));
      } else {
        // 如果没有数据，可以设置默认值或者保持为空
        setWord("");
        console.log("not word found");
      }
    } catch (err) {
      alert("读取失败：" + err);
      setPreOneDisable(false);
    }
  };
  // // 单词数据库：MyDb
  // const juniorDB: LocalForage = localforage.createInstance({
  //   name: "MyDb", //数据库名
  //   storeName: "juniorStore", // 类似于表名
  // });
  // // 单词数据库：MySenior
  // const allWordDB = localforage.createInstance({
  //   name: "AllWORD", //数据库名
  //   storeName: "wordStore", // 类似于表名
  // });
  // // 中文释义
  // function connectTranslations(translations: TranslationsItem[]): string {
  //   let str: string = "";
  //   for (const value of translations) {
  //     console.log(value.translation, value.type);
  //     str += value.translation + " " + value.type;
  //   }
  //   return str;
  // }

  async function importJsonData(List: JsonObject) {
    try {
      console.log("import data");

      const entries = Object.entries(List);
      await Promise.all(
        entries.map(([_, value]) => {
          return juniorDbRef.current.setItem(value["word"], {
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
      const storedData: storedWord | null = await juniorDbRef.current.getItem(
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
      entries.map(([_, value]) => {
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

      let myArrData: Array<string> = []; //有语音的单词
      let myJson: any;
      let obj2: RecordType = {};

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
    clearStore(juniorDbRef.current);
    importJsonData(juniorList);
  };
  const importDataAll = () => {
    importJsonDataAll();
  };
  const getWord = () => {
    getData();
  };
  useEffect(() => {
    // 执行读取
    getGroupWords();

    // 每秒减1
    const timer = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    // 倒计时到0就停止，并进入单词页
    if (count === 0) {
      clearInterval(timer);
      setIsCountFinish(true);
      nextOne();
    }

    // 清理定时器
    return () => clearInterval(timer);
  }, [count]); // 空依赖数组，确保只在组件挂载时执行一次

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

  // —————— 倒计时页面 ——————
  if (!isCountFinish) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{
          height: "100vh",
          width: "100%",
          // backgroundColor: "#ffe8cc",
        }}
      >
        <Title level={1} style={{ fontSize: 120, color: "#ffe8cc" }}>
          {/* {count} */}
          Start
        </Title>
      </Flex>
    );
  }

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
            <Button
              type="primary"
              key="unknownWord"
              onClick={preOne}
              disabled={preOneDisable}
            >
              上一个
            </Button>,
            <Button
              type="primary"
              key="showTranslations"

              // style={{ backgroundColor: "#ffe8cc" }}
            >
              开始学习
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
            width: "100%",
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
