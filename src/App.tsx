import { Card, Button, Flex, Typography, Modal, message, Divider } from "antd"; // 1. 导入 Card 组件
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import useLocalforageDb, { getOneDataByKey } from "./utils/useLocalforageDb.ts";
import { getAllDataFromStore, isArrayNonEmpty } from "./utils/arrayFunc.ts";

const { Title } = Typography;

// 1. 定义对象的结构
interface TranslationsItem {
  translation: string; // 对应 "能力，能耐；才能"
  type: string; // 对应 "n" (词性)
}

interface SentencesItem {
  sentence: string;
  translation: string;
}

interface storedWord {
  word: string;
  translations: string;
  uk: string;
  sentences: string;
}
// word data with group
interface groupWord {
  group: number;
  word: string;
  isKnown: boolean;
  index?: number;
}
const App: React.FC = () => {
  const navigate = useNavigate();
  // const location = useLocation();
  //解构参数（加类型注解更规范）
  // const { group } = location.state || {};

  // pop massage
  const [messageApi, contextHolder] = message.useMessage();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // const showModal = () => {
  //   setIsModalOpen(true);
  // };

  const handleOk = () => {
    setIsModalOpen(false);
    navigate("/daytask");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const [isFilterWordModalOpen, setIsFilterWordModalOpen] = useState(false);

  const showFilterWordModal = () => {
    setIsFilterWordModalOpen(true);
  };
  const filterWordHandleOk = () => {
    setIsFilterWordModalOpen(false);
    navigate("/list");
  };

  const filterWordhandleCancel = () => {
    setIsFilterWordModalOpen(false);
  };

  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));
  const groupRef = useRef<number>(1);

  const [wordIndex, setWordIndex] = useState<number>(1); // 定义状态
  const [word, setWord] = useState<string>("");
  const [phonetic, setPhonetic] = useState<string>("");
  const [sentencesArr, setSentencesArr] = useState<SentencesItem[]>([]);
  const [translationsArr, setTranslationsArr] = useState<TranslationsItem[]>(
    [],
  );
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
  const getGroupWords = async () => {
    await getAllDataFromStore(juniorGroupDbRef.current).then((data) => {
      // console.log("11groupData:", data, groupRef.current);
      if (data) {
        data = (data as groupWord[]).filter((item) => {
          return item.group == groupRef.current && item.isKnown === false;
        });
        // console.log("221groupData:", data);
        data = (data as groupWord[]).map((item, idx) => ({
          ...item, // 展开原有的所有属性
          index: idx + 1, // 添加 index，从 1 开始
        }));
        // console.log("444", data);
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
      // console.log("111==", wordData, wordIndex);
      if (wordIndex > wordData.length) {
        throw new Error("已到达最后一个");
      }
      let showWord = wordData.filter((item) => item.index === wordIndex);

      if (!isArrayNonEmpty(showWord)) {
        throw new Error("未找到单词");
      }
      // current word index, make pre or next
      preWordRef.current = (showWord[0]["index"] as number) - 1;
      setWordIndex((showWord[0]["index"] as number) + 1);
      const storedData: storedWord | null = await juniorDbRef.current.getItem(
        showWord[0]["word"],
      );
      // console.log("333==", wordData, showWord, wordIndex, storedData);

      // 2. 判断数据是否存在
      if (storedData) {
        // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
        setWord(storedData["word"]);

        setPhonetic(storedData["uk"]);

        // vs code prompt type error, this is strict ensure type correct
        if (Array.isArray(storedData["translations"])) {
          setTranslationsArr(storedData["translations"]);
        }

        if (Array.isArray(storedData["sentences"])) {
          setSentencesArr(storedData["sentences"]);
        }

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
      // todo congratulate user finish all words in group

      if (err instanceof Error && err.message.includes("已到达最后一个")) {
        setIsModalOpen(true);
      }
      setNextOneDisable(false);
    }
  };
  const preOnefromArray = async () => {
    try {
      setPreOneDisable(true);
      if (preWordRef.current < 1) {
        // console.log(666);
        throw new Error("已到达第一个");
        // showWord is empty
      }
      let showWord = wordData.filter(
        (item) => item.index === preWordRef.current,
      );
      if (!isArrayNonEmpty(showWord)) {
        throw new Error("未找到单词");
      }
      // current word index, make pre or next
      preWordRef.current = (showWord[0]["index"] as number) - 1;
      setWordIndex((showWord[0]["index"] as number) + 1);
      const storedData: storedWord | null = await juniorDbRef.current.getItem(
        showWord[0]["word"],
      );
      // console.log("000==", wordData, showWord, wordIndex, storedData);

      let translations_arr: TranslationsItem[] = [];
      // 2. 判断数据是否存在
      if (storedData) {
        // console.log("X:", typeof storedData["translations"]);
        // 如果存在，更新到 state (localforage 会自动反序列化对象/数组)
        setWord(storedData["word"]);

        setPhonetic(storedData["uk"]);

        // vs code prompt type error, this is strict ensure type correct
        if (Array.isArray(storedData["translations"])) {
          setTranslationsArr(storedData["translations"]);
        }

        if (Array.isArray(storedData["sentences"])) {
          setSentencesArr(storedData["sentences"]);
        }
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
      messageApi.info(err instanceof Error ? err.message : "操作失败");

      setPreOneDisable(false);
    }
  };

  useEffect(() => {
    getOneDataByKey(configDbRef.current, "cur_group").then((group) => {
      groupRef.current = group as number;
      // get group, then get group words
      getGroupWords();
    });

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
          height: "90vh",
          padding: 16,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {contextHolder}
        <Modal
          title="恭喜完成"
          okText="确定"
          cancelText="取消"
          closable={{ "aria-label": "Custom Close Button" }}
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <Divider />
          <p>继续下一个小组学习</p>
        </Modal>
        <Modal
          title="筛选简单的单词"
          okText="确定"
          cancelText="取消"
          closable={{ "aria-label": "Custom Close Button" }}
          open={isFilterWordModalOpen}
          onOk={filterWordHandleOk}
          onCancel={filterWordhandleCancel}
          styles={{
            header: {},
            body: {},
          }}
        >
          <Divider />
          <p>比如in、of、book、for、with等熟悉的单词</p>
          <p>对于别人难，但是你已经掌握的单词</p>
          <p>选中这些单词就不会出现，建议首次学习筛选</p>
        </Modal>
        <Card
          title="初中单词"
          extra={
            <>
              <Button onClick={showFilterWordModal}>筛选</Button>
            </>
          }
          actions={[
            // 通常放按钮或带点击事件的元素
            <Button
              type="primary"
              key="pre"
              onClick={preOne}
              disabled={preOneDisable}
            >
              上一个
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
              background: "#4096FF", // 顶部蓝色
              color: "#fafafa",
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
          <p style={{ fontSize: 22, fontWeight: 500 }}>{phonetic}</p>
          {/* 使用可选链 (Optional Chaining) */}
          {translationsArr?.map((item, index) => (
            <p key={index}>
              {item.translation} {item.type}
            </p>
          ))}

          {sentencesArr?.map((item, index) => (
            <p key={index}>
              {item.sentence}
              {item.translation}
            </p>
          ))}
        </Card>
      </div>
    </>
  );
};

export default App;
