import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  Radio,
  Button,
  message,
  Spin,
} from "antd";

import { BookOutlined } from "@ant-design/icons";
import "./BookSelect.css";

import useLocalforageDb, {
  getOneDataByKey,
  setOneDataByKey,
} from "../utils/useLocalforageDb";

import { arrayShuffle, isArrayNonEmpty } from "../utils/arrayFunc";
import {
  saveOneData,
  saveListData,
  clearStore,
} from "../utils/useLocalforageDb";

import { getReviewDates } from "../utils/studyCommon";

import axios, { all } from "axios";

const { Title } = Typography;

// 单词级别类型
export type BookLevel = "junior" | "senior" | "cet4" | "cet6" | "kaoyan";

interface BookItem {
  key: BookLevel;
  title: string;
  desc: string;
  totalWords: number; // 总单词数
}

// word data with group
interface groupWord {
  group: number;
  word: string;
}

interface storedWord {
  word: string;
  translations: string;
  uk: string;
  sentences: string;
}

interface SchemeBrief {
  key?: string;
  book?: string;
  wordsGroup: number;
  groupNums: number;
  startDay?: string;
}

// study scheme 类型定义
interface StudyItem {
  id: string;
  title: string;
  learnDate: string; // 格式：YYYY-MM-DD
}

interface ReviewItem {
  id: string;
  studyId: string;
  title: string;
  reviewDate: string; // 格式：YYYY-MM-DD
}

interface projConfig {
  hasInit: boolean;
}

// 每日学习数量
type DailyCount = 20 | 30 | 40 | 50 | 60 | 70 | 80 | 100;

const BookSelect = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 新增：用ref存储数据库实例，避免重复初始化
  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));
  const juniorDbRef = useRef(useLocalforageDb("MyDb", "juniorStore"));
  const seniorDbRef = useRef(useLocalforageDb("MyDb", "seniorStore"));
  const cet4DbRef = useRef(useLocalforageDb("MyDb", "cet4Store"));
  const cet6DbRef = useRef(useLocalforageDb("MyDb", "cet6Store"));
  const kaoyanDbRef = useRef(useLocalforageDb("MyDb", "kaoyanStore"));
  const wordGroupDbRef = useRef(useLocalforageDb("MyDb", "wordGroup"));
  const SchemeBriefDbRef = useRef(useLocalforageDb("MyDb", "schemeBrief"));
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));
  const reviewSchemeDbRef = useRef(useLocalforageDb("MyDb", "reviewScheme"));
  // read from db, save to array
  async function getAllDataFromStore(Db: LocalForage) {
    const dataArray: groupWord[] = [];

    try {
      // 方法一：使用 iterate (推荐，效率高)
      // iterate 接收回调函数，遍历所有键值对
      await Db.iterate((value: storedWord) => {
        // 将每一条数据构造成对象，推入数组
        // console.log(value);
        if (!value || !value["word"]) {
          // console.log(key, Db.getItem(key), Db.getItem("OK"));
          return;
        }
        dataArray.push({
          group: 0,
          word: value["word"],
        });

        // 注意：在 iterate 中不能使用 return 来中断（除非抛出异常），它是同步遍历
      });

      // console.log("获取到的数据数组:", dataArray);
      return dataArray;
    } catch (err) {
      console.error("读取数据失败:", err);
    }
  }

  // 1. 单词本数据（你可以改成自己的真实数量）
  const BookList: BookItem[] = [
    { key: "junior", title: "初中单词", desc: "Junior High", totalWords: 1991 },
    { key: "senior", title: "高中单词", desc: "Senior High", totalWords: 3753 },
    { key: "cet4", title: "四级单词", desc: "CET-4", totalWords: 4544 },
    { key: "cet6", title: "六级单词", desc: "CET-6", totalWords: 3992 },
    { key: "kaoyan", title: "考研单词", desc: "Kaoyan", totalWords: 5057 },
  ];

  // 2. 状态
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [dailyCount, setDailyCount] = useState<DailyCount>(30); //daily new words count
  const [allData, setAllData] = useState<groupWord[]>([]);

  // 初始化 navigate 方法
  const navigate = useNavigate();

  // 3. 选择单词本 → 弹出计划
  const handleSelectBook = (item: BookItem) => {
    if (item["key"] === "junior") {
      // console.log(item);
      getAllDataFromStore(juniorDbRef.current).then((data) => {
        if (data) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        }
      });
    } else if (item["key"] === "senior") {
      getAllDataFromStore(seniorDbRef.current).then((data) => {
        if (data) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        }
      });
    } else if (item["key"] === "cet4") {
      getAllDataFromStore(cet4DbRef.current).then((data) => {
        if (data) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        }
      });
    } else if (item["key"] === "cet6") {
      getAllDataFromStore(cet6DbRef.current).then((data) => {
        if (data) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        }
      });
    } else if (item["key"] === "kaoyan") {
      getAllDataFromStore(kaoyanDbRef.current).then((data) => {
        if (data) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        }
      });
    } else {
      console.log(item["key"]);
      return;
    }

    setDailyCount(30);
    setPlanModalVisible(true);
  };

  // 4. 计算学习完成天数
  //dailyCount change lead to BookSelect reload,totalDays will be update new value.
  const totalWords = allData.length || 0;
  const totalDays = Math.ceil(totalWords / dailyCount);

  // 5. 确认计划
  const handleConfirmPlan = async () => {
    setPlanModalVisible(false);

    let mySchemeBrief: SchemeBrief = {
      key: selectedBook?.key,
      book: selectedBook?.title,
      wordsGroup: dailyCount,
      groupNums: totalDays,
      startDay: dayjs(new Date().getTime()).format("YYYY-MM-DD"),
    };

    try {
      // clear data, then save new
      await clearStore(SchemeBriefDbRef.current);
      await saveOneData(SchemeBriefDbRef.current, mySchemeBrief);
    } catch (err) {
      // pop windows , prompt try again
      console.log("SchemeBrief", err);
    }

    // group words
    const result: groupWord[] = arrayShuffle(allData).map((item, index) => {
      return {
        ...item,
        isKnown: false, // 新增字段，默认值为 false
        group: Math.floor(index / dailyCount) + 1, // 每dailyCount个一组
      };
    });

    await clearStore(wordGroupDbRef.current);
    await saveListData<groupWord>(wordGroupDbRef.current, result);

    // 每天学习数据的构造

    const n: number = totalDays; // 假设循环 5 次
    let schemeArr: StudyItem[] = [];
    // create new scheme must clear userScheme db at first.
    // real 学习数据
    schemeArr = Array.from({ length: n }, (_, index) => ({
      id: (index + 1).toString(), // index 从 0 开始，所以 +1
      title: `单词 Day ${index + 1}`,
      learnDate: dayjs().add(index, "day").format("YYYY-MM-DD"),
    }));

    await clearStore(userSchemeDbRef.current);
    // save scheme to db, review scheme gene by getReviewDates()
    saveListData<StudyItem>(userSchemeDbRef.current, schemeArr);

    // calculate review day ,and save to db
    const resultArr: ReviewItem[] = schemeArr.flatMap((item) => {
      // 获取该单词的所有复习日期
      const reviewDates = getReviewDates(item.learnDate);

      // 将每个复习日期与原对象的 id、title 组合成新对象
      return reviewDates.map((date, index) => ({
        id: (index + 1).toString(),
        studyId: item.id,
        title: item.title,
        reviewDate: date, // 这里使用 reviewDate 作为新字段名
      }));
    });
    await clearStore(reviewSchemeDbRef.current);
    await saveListData<ReviewItem>(reviewSchemeDbRef.current, resultArr);

    message.success(
      `已选择：${selectedBook?.title}，每天 ${dailyCount} 个，共 ${totalDays + 21} 天完成！`,
    );

    // 这里可以跳转到单词任务页面
    navigate("/daytask", {
      state: {
        wordBook: selectedBook,
        dailyCount,
        totalDays,
        startDay: "",
      },
    });
  };

  async function importJsonData(arr: storedWord[], Db: LocalForage) {
    try {
      await clearStore(Db);
      await Promise.all(
        arr.map((value) => {
          return Db.setItem(value["word"], {
            word: value["word"],
            translations: value["translations"],
            uk: value["uk"],
            sentences: value["sentences"],
          });
        }),
      );
      console.log("导入成功！");
      return true;
    } catch (err) {
      console.log("导入数据失败:", err);
      return false;
    }
  }

  const reloadClick = () => {
    navigate("/book", {
      state: {
        message: "数据初始化失败，请刷新重试！",
      },
    });
  };

  useEffect(() => {
    let hasInit: boolean = false;
    getOneDataByKey(configDbRef.current, "junior-config").then((config) => {
      if (config) {
        // console.log("11111", config);
        hasInit = (config as projConfig)["hasInit"];
      }
      if (hasInit === true) {
        setLoading(false);
      }

      // console.log("12222", hasInit);
      if (hasInit === false) {
        //set hasInit to true , then catch error,set hasInit to false. avoid repeat import when data file exist but error in data.
        setOneDataByKey(configDbRef.current, "junior-config", {
          hasInit: true,
        });

        // 路径直接以 / 开头，指向 public 目录
        try {
          // save junior high data to db
          axios
            .get("junior_data.json")
            .then((response) => {
              // console.log("333", response);
              // judge data is array and not empty, return true, else false
              if (isArrayNonEmpty(response.data) === false) {
                throw new Error("***_data.json is empty");
              }
              // throw new Error("模拟错误123123");
              return importJsonData(response.data, juniorDbRef.current).then(
                (res) => {
                  // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
                  if (res === false) {
                    throw new Error("***_data导入失败666");
                  }
                },
              );
            })
            .catch((error) => {
              console.log("***_data出错:", error);
              setOneDataByKey(configDbRef.current, "junior-config", {
                hasInit: false,
              });
              setError("数据初始化失败，请刷新重试！");
            });

          // save senior high data to db
          axios
            .get("senior_data.json")
            .then((response) => {
              // console.log("333", response);
              // judge data is array and not empty, return true, else false
              if (isArrayNonEmpty(response.data) === false) {
                throw new Error("***_data.json is empty");
              }
              // throw new Error("模拟错误123123");
              return importJsonData(response.data, seniorDbRef.current).then(
                (res) => {
                  // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
                  if (res === false) {
                    throw new Error("***_data导入失败666");
                  }
                },
              );
            })
            .catch((error) => {
              console.log("***_data出错:", error);
              setOneDataByKey(configDbRef.current, "junior-config", {
                hasInit: false,
              });
              setError("数据初始化失败，请刷新重试！");
            });

          // save CET4 data to db
          axios
            .get("cet4_data.json")
            .then((response) => {
              // console.log("333", response);
              // judge data is array and not empty, return true, else false
              if (isArrayNonEmpty(response.data) === false) {
                throw new Error("***_data.json is empty");
              }
              // throw new Error("模拟错误123123");
              return importJsonData(response.data, cet4DbRef.current).then(
                (res) => {
                  // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
                  if (res === false) {
                    throw new Error("***_data导入失败666");
                  }
                },
              );
            })
            .catch((error) => {
              console.log("***_data出错:", error);
              setOneDataByKey(configDbRef.current, "junior-config", {
                hasInit: false,
              });
              setError("数据初始化失败，请刷新重试！");
            });

          // save CET6 data to db
          axios
            .get("cet6_data.json")
            .then((response) => {
              // console.log("333", response);
              // judge data is array and not empty, return true, else false
              if (isArrayNonEmpty(response.data) === false) {
                throw new Error("***_data.json is empty");
              }
              // throw new Error("模拟错误123123");
              return importJsonData(response.data, cet6DbRef.current).then(
                (res) => {
                  // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
                  if (res === false) {
                    throw new Error("***_data导入失败666");
                  }
                },
              );
            })
            .catch((error) => {
              console.log("***_data出错:", error);
              setOneDataByKey(configDbRef.current, "junior-config", {
                hasInit: false,
              });
              setError("数据初始化失败，请刷新重试！");
            });

          // save kaoyan data to db
          axios
            .get("kaoyan_data.json")
            .then((response) => {
              // console.log("333kaoyan", response);
              // judge data is array and not empty, return true, else false
              if (isArrayNonEmpty(response.data) === false) {
                throw new Error("***_data.json is empty");
              }
              // throw new Error("模拟错误123123");
              return importJsonData(response.data, kaoyanDbRef.current).then(
                (res) => {
                  setLoading(false); // 数据初始化完成，关闭加载状态。这个数据量最大，等它最后加载完成再关闭loading。也可以放在每个数据的then里，但可能会提前关闭loading。
                  // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
                  if (res === false) {
                    throw new Error("***_data导入失败666");
                  }
                },
              );
            })
            .catch((error) => {
              console.log("***_data出错:", error);
              setOneDataByKey(configDbRef.current, "junior-config", {
                hasInit: false,
              });
              setError("数据初始化失败，请刷新重试！");
            });
        } catch (err) {
          console.log("Error:", err);
        } finally {
        }
      }
    });
  }, []);

  // data load error, prompt user to refresh page.
  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p style={{ color: "red" }}> {error}</p>
        {/* 重新加载按钮 */}
        <button
          onClick={reloadClick}
          style={{ padding: "10px 20px", fontSize: "16px" }}
        >
          点击重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="word-select-container">
      <Spin spinning={loading} fullscreen />;
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <div className="title-wrapper">
          <Title level={2}>选择单词本</Title>
        </div>

        <Row gutter={[24, 24]}>
          {BookList.map((item) => (
            <Col xs={24} sm={12} md={12} lg={6} key={item.key}>
              <Card
                className="word-card"
                hoverable
                onClick={() => handleSelectBook(item)}
              >
                <div className="card-icon">
                  <BookOutlined />
                </div>
                <div className="card-title">{item.title}</div>
                <div className="card-desc">{item.desc}</div>
                <div className="card-total">共 {item.totalWords} 词</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
      {/* ========== 学习计划弹窗 ========== */}
      <Modal
        title={`学习计划：${selectedBook?.title}`}
        open={planModalVisible}
        onCancel={() => setPlanModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPlanModalVisible(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={handleConfirmPlan}>
            开始学习
          </Button>,
        ]}
      >
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <div>请选择每日学习数量：</div>
          <Radio.Group
            value={dailyCount}
            onChange={(e) => setDailyCount(e.target.value as DailyCount)}
          >
            <Radio value={20}>每天 20 个</Radio>
            <Radio value={30}>每天 30 个</Radio>
            <Radio value={40}>每天 40 个</Radio>
            <Radio value={50}>每天 50 个</Radio>
            <Radio value={60}>每天 60 个</Radio>
            <Radio value={70}>每天 70 个</Radio>
            <Radio value={80}>每天 80 个</Radio>
            <Radio value={100}>每天 100 个</Radio>
          </Radio.Group>

          <div style={{ marginTop: 10 }}>
            <p>总单词数：{totalWords} 个</p>
            <p>
              学习组数：<strong>{totalDays}</strong> 组
            </p>
            <p>
              学习天数：<strong>{totalDays + 21}</strong> 天
            </p>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default BookSelect;
