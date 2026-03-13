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
import { isArrayNonEmpty, isEmpty } from "./utils/arrayFunc.ts";
import "./App.css";

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

  const wordDataRef = useRef<groupWord[]>([]);

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
        // console.log("555", data);
        wordDataRef.current = data as groupWord[];
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
      // if `true` if an utterance is currently in the process of being spoken
      if (speechSynthesis && speechSynthesis.speaking === true) {
        // cancel is speaking word.
        speechSynthesis.cancel();
      }
      setNextOneDisable(true);
      // console.log("111==", wordDataRef.current.length, wordIndex);
      if (wordIndex > wordDataRef.current.length) {
        throw new Error("已到达最后一个");
      }
      let showWord = wordDataRef.current.filter(
        (item) => item.index === wordIndex,
      );

      if (!isArrayNonEmpty(showWord)) {
        throw new Error("未找到单词");
      }
      // current word index, make pre or next
      preWordRef.current = (showWord[0]["index"] as number) - 1;
      setWordIndex((showWord[0]["index"] as number) + 1);
      let storedData: storedWord | null = await wordDbRef.current.getItem(
        showWord[0]["word"],
      );
      // console.log("666==", showWord, storedData);
      //  unknown the reason why getItem return null, run it again
      if (isEmpty(storedData)) {
        // delay 500ms
        await new Promise((resolve) => setTimeout(resolve, 500));
        storedData = await wordDbRef.current.getItem(showWord[0]["word"]);
        // console.log("777==", showWord, storedData);
      }
      // console.log("888==", showWord);
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

        if (soundValueRef.current == "on") {
          setTimeout(() => {
            //发音
            // speechSynthesis.speak(
            //   new SpeechSynthesisUtterance(storedData["word"]),
            // );
            if ("speechSynthesis" in window) {
              // 创建 SpeechSynthesisUtterance 对象
              const utterance = new SpeechSynthesisUtterance(
                storedData["word"],
              );
              // 设置语速，范围从 0.1 到 10，默认值为 1
              utterance.rate = 0.8;
              // 设置语言，例如 "en - US" 代表美式英语，"zh - CN" 代表中文普通话（中国大陆）
              utterance.lang = "en-GB";
              // 调用 speak 方法进行语音播报
              speechSynthesis.speak(utterance);
            }
          }, 300);
        }

        setTimeout(() => {
          setNextOneDisable(false);
        }, 500);
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
      if (speechSynthesis && speechSynthesis.speaking === true) {
        // cancel is speaking word.
        speechSynthesis.cancel();
      }
      setPreOneDisable(true);
      if (preWordRef.current < 1) {
        // console.log(666);
        throw new Error("已到达第一个");
        // showWord is empty
      }
      let showWord = wordDataRef.current.filter(
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

        if (soundValueRef.current == "on") {
          setTimeout(() => {
            //发音
            // speechSynthesis.speak(
            //   new SpeechSynthesisUtterance(storedData["word"]),
            // );
            if ("speechSynthesis" in window) {
              // 创建 SpeechSynthesisUtterance 对象
              const utterance = new SpeechSynthesisUtterance(
                storedData["word"],
              );
              // 设置语速，范围从 0.1 到 10，默认值为 1
              utterance.rate = 0.8;
              // 设置语言，例如 "en - US" 代表美式英语，"zh - CN" 代表中文普通话（中国大陆）
              utterance.lang = "en-GB";
              // 调用 speak 方法进行语音播报
              speechSynthesis.speak(utterance);
            }
          }, 300);
        }

        setTimeout(() => {
          setPreOneDisable(false);
        }, 300);
      } else {
        // 如果没有数据，可以设置默认值或者保持为空
        setWord("");
        console.log("not word found");
      }
    } catch (err) {
      if (err && (err as Error).message == "已到达第一个")
        messageApi.info({
          type: "error",
          content: "已到达第一个",
          duration: 3,
          style: {
            fontSize: "1.2rem",
            marginTop: "5vh",
          },
        });

      setPreOneDisable(false);
    }
  };

  useEffect(() => {
    const pageInit = async () => {
      await getOneDataByKey(configDbRef.current, "cur_group")
        .then((group) => {
          if (!isEmpty(group)) {
            groupRef.current = group as number;
            // get group, then get group words
            getGroupWords().then(() => {
              nextOne();

              setTimeout(() => {
                setIsCountFinish(true);
              }, 500);
            });
          } else {
            navigate(-1);
          }
        })
        .catch(() => {
          navigate(-1);
        });

      getOneDataByKey(configDbRef.current, "cur_study")
        .then((currentStudy) => {
          if (!isEmpty(currentStudy)) {
            studyKeyRef.current = currentStudy as currentStudy;
          } else {
            navigate(-1);
          }
        })
        .catch(() => {
          navigate(-1);
        });

      await getOneData(schemeBriefDbRef.current)
        .then((scheme) => {
          if (!isEmpty(scheme)) {
            bookRef.current = (scheme as SchemeBrief)["book"] as string;
          } else {
            navigate("/daytask");
          }
        })
        .catch(() => {
          navigate("daytask");
        });

      getOneDataByKey(configDbRef.current, "sound-config").then((value) => {
        if (typeof value === "string") {
          soundValueRef.current = value;
        } else {
          //empty , default sound is on
          soundValueRef.current = "on";
        }
      });
    };

    pageInit();
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

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
            onTouchEnd={(e) => {
              preOne();
              e.preventDefault();
            }}
            onClick={preOne}
            disabled={preOneDisable}
            size="large"
          >
            上一个
          </Button>,
          <Button
            type="primary"
            key="next"
            disabled={nextOneDisable}
            onTouchEnd={(e) => {
              nextOne();
              e.preventDefault();
            }}
            onClick={nextOne}
            size="large"
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
          borderRadius: 3,
        }}
        // ✅ 新版 antd 推荐：用 styles 代替 bodyStyle
        styles={{
          header: {
            background: "#4096FF", // 顶部蓝色
            color: "#fafafa",
            fontSize: "16px",
            fontWeight: 500,
            borderRadius: 2,
          },
          body: {
            flex: 1,
            overflowY: "auto", // 内容内部滚动
            padding: "16",
          },
          actions: {
            display: "flex",
            minHeight: "80px",
            height: "80px",
            backgroundColor: "#E6F4FF",
            borderTop: "1px solid #e8e8e8",
            alignItems: "center",
          },
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 500 }}>{word}</p>
          <div style={{ fontSize: 20, fontWeight: 300, color: "#64748b" }}>
            <Space>
              {phonetic && "[" + phonetic + "]"}
              <SoundOutlined
                style={{ paddingTop: 10 }}
                onClick={() => {
                  if ("speechSynthesis" in window) {
                    // 创建 SpeechSynthesisUtterance 对象
                    const utterance = new SpeechSynthesisUtterance(word);
                    // 设置语速，范围从 0.1 到 10，默认值为 1
                    utterance.rate = 0.8;
                    // 设置语言，例如 "en - US" 代表美式英语，"zh - CN" 代表中文普通话（中国大陆）
                    utterance.lang = "en-GB";
                    // 调用 speak 方法进行语音播报
                    speechSynthesis.speak(utterance);
                  } else {
                    // if browser has not speechSynthesis, prompt user to download Edge
                    messageApi.warning({
                      type: "warning",
                      content:
                        "该程序不支持当前浏览器发音，如需单词发音，请下载Edge",
                      duration: 5,
                      style: {
                        fontSize: "1.2rem",
                        marginTop: "5vh",
                      },
                    });
                  }
                }}
              />
            </Space>
          </div>
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
