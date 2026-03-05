import {
  Card,
  Button,
  Flex,
  Typography,
  Modal,
  message,
  Divider,
  Space,
} from "antd"; // 1. 导入 Card 组件
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SoundOutlined, CloseCircleOutlined } from "@ant-design/icons";
import useLocalforageDb, {
  getOneData,
  getOneDataByKey,
  getAllDataFromStore,
  setOneDataByKey,
} from "./utils/useLocalforageDb.ts";
import { isArrayNonEmpty } from "./utils/arrayFunc.ts";

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
interface SchemeBrief {
  key?: string;
  book?: string;
  wordsGroup: number;
  groupNums: number;
  startDay?: string;
}
interface currentStudy {
  studyType: "learn" | "review";
  db_key: string;
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

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const showCloseModal = () => {
    setIsCloseModalOpen(true);
  };
  const closeHandleOk = () => {
    setIsCloseModalOpen(false);
    navigate("/daytask");
  };

  const closeHandleCancel = () => {
    setIsCloseModalOpen(false);
  };

  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));
  // current group
  const groupRef = useRef<number>(1);
  // current db_dkey of learn or review scheme
  const studyKeyRef = useRef<currentStudy>({ studyType: "learn", db_key: "" });
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));
  const reviewSchemeDbRef = useRef(useLocalforageDb("MyDb", "reviewScheme"));
  const schemeBriefDbRef = useRef(useLocalforageDb("MyDb", "schemeBrief"));
  // current word book of studying
  const bookRef = useRef<string>("");
  // word sound voice on or off
  const soundValueRef = useRef<string>("on");
  // temp index of studing word
  const [wordIndex, setWordIndex] = useState<number>(1);
  // temp pre word index
  const preWordRef = useRef<number>(1);
  const [word, setWord] = useState<string>("");
  const [phonetic, setPhonetic] = useState<string>("");
  const [sentencesArr, setSentencesArr] = useState<SentencesItem[]>([]);
  const [translationsArr, setTranslationsArr] = useState<TranslationsItem[]>(
    [],
  );

  // control word shift time
  const [nextOneDisable, setNextOneDisable] = useState<boolean>(false);
  const [preOneDisable, setPreOneDisable] = useState<boolean>(false);

  const [wordData, setWordData] = useState<groupWord[]>([]);

  const wordGroupDbRef = useRef(useLocalforageDb("MyDb", "wordGroup"));
  const wordDbRef = useRef(useLocalforageDb("MyDb", "juniorStore"));

  const juniorDb = useLocalforageDb("MyDb", "juniorStore");
  const seniorDb = useLocalforageDb("MyDb", "seniorStore");
  const cet4Db = useLocalforageDb("MyDb", "cet4Store");
  const cet6Db = useLocalforageDb("MyDb", "cet6Store");
  const kaoyanDb = useLocalforageDb("MyDb", "kaoyanStore");

  if (bookRef.current === "初中单词") {
    wordDbRef.current = juniorDb;
  } else if (bookRef.current === "高中单词") {
    wordDbRef.current = seniorDb;
  } else if (bookRef.current === "四级单词") {
    wordDbRef.current = cet4Db;
  } else if (bookRef.current === "六级单词") {
    wordDbRef.current = cet6Db;
  } else if (bookRef.current === "考研单词") {
    wordDbRef.current = kaoyanDb;
  }

  // 倒计时数字
  const [count, setCount] = useState(1);
  // 是否结束倒计时
  const [isCountFinish, setIsCountFinish] = useState(false);

  // get group words which need to learn
  const getGroupWords = async () => {
    await getAllDataFromStore(wordGroupDbRef.current).then((data) => {
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
      const storedData: storedWord | null = await wordDbRef.current.getItem(
        showWord[0]["word"],
      );

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
        if (soundValueRef.current == "on") {
          setTimeout(() => {
            //发音
            speechSynthesis.speak(
              new SpeechSynthesisUtterance(storedData["word"]),
            );
          }, 500);
        }

        setTimeout(() => {
          setNextOneDisable(false);
        }, 1500);
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
        if (studyKeyRef.current["studyType"] === "learn") {
          getOneDataByKey(
            userSchemeDbRef.current,
            studyKeyRef.current["db_key"],
          )
            .then((value) => {
              // console.log({ ...value, isFinish: true });
              if (value && typeof value === "object" && "isFinish" in value) {
                if (value["isFinish"] === false) {
                  setOneDataByKey(
                    userSchemeDbRef.current,
                    studyKeyRef.current["db_key"],
                    { ...value, isFinish: true },
                  );
                }
              }
            })
            .catch((err) => {
              console.log((err as Error).message);
            });
        }

        if (studyKeyRef.current["studyType"] === "review") {
          getOneDataByKey(
            reviewSchemeDbRef.current,
            studyKeyRef.current["db_key"],
          )
            .then((value) => {
              // console.log({ ...value, isFinish: true });
              if (value && typeof value === "object" && "isFinish" in value) {
                if (value["isFinish"] === false) {
                  setOneDataByKey(
                    reviewSchemeDbRef.current,
                    studyKeyRef.current["db_key"],
                    { ...value, isFinish: true },
                  );
                }
              }
            })
            .catch((err) => {
              console.log((err as Error).message);
            });
        }
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
      const storedData: storedWord | null = await wordDbRef.current.getItem(
        showWord[0]["word"],
      );
      // console.log("000==", wordData, showWord, wordIndex, storedData);
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
        if (soundValueRef.current == "on") {
          setTimeout(() => {
            //发音
            speechSynthesis.speak(
              new SpeechSynthesisUtterance(storedData["word"]),
            );
          }, 500);
        }

        setTimeout(() => {
          setPreOneDisable(false);
        }, 1500);
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

    getOneDataByKey(configDbRef.current, "cur_study").then((currentStudy) => {
      studyKeyRef.current = currentStudy as currentStudy;
      console.log(studyKeyRef.current);
    });

    getOneData(schemeBriefDbRef.current).then((scheme) => {
      if (scheme) {
        bookRef.current = (scheme as SchemeBrief)["book"] as string;
      }
    });

    getOneDataByKey(configDbRef.current, "sound-config").then((value) => {
      if (typeof value === "string") {
        soundValueRef.current = value;
      } else {
        //empty , default sound is on
        soundValueRef.current = "on";
      }
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
      <Modal
        title="确定放弃本次学习吗？"
        okText="确定"
        cancelText="取消"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isCloseModalOpen}
        onOk={closeHandleOk}
        onCancel={closeHandleCancel}
        styles={{
          header: {},
          body: {},
        }}
      >
        <Divider />
        <p>坚持比放弃多一划，所以坚持比放弃更难一些。</p>
      </Modal>
      <Card
        title={
          <>
            <Space>
              <CloseCircleOutlined onClick={showCloseModal} />
              {bookRef.current}
            </Space>
          </>
        }
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
          height: "96vh",
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
            backgroundColor: "#E6F4FF",
            borderTop: "1px solid #e8e8e8",
          },
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 500 }}>{word}</p>
          <p style={{ fontSize: 20, fontWeight: 300, color: "#64748b" }}>
            <Space>
              [{phonetic}]
              <SoundOutlined
                style={{ paddingTop: 10 }}
                onClick={() => {
                  speechSynthesis.speak(new SpeechSynthesisUtterance(word));
                }}
              />
            </Space>
          </p>
          {/* 使用可选链 (Optional Chaining) */}
          {translationsArr?.map((item, index) => (
            <p
              style={{ fontSize: 16, fontWeight: 300, color: "#333" }}
              key={index}
            >
              {item.translation}{" "}
              <span style={{ color: "#1e293b" }}>{item.type}</span>
            </p>
          ))}
          <Divider />
          {sentencesArr?.slice(0, 2).map((item, index) => (
            <div key={index}>
              <p style={{ fontSize: 18, fontWeight: 300, color: "#1e293b" }}>
                {item.sentence}
              </p>
              <p style={{ fontSize: 16, fontWeight: 300, color: "#333" }}>
                {item.translation}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

export default App;
