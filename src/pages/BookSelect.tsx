import { Link, useNavigate } from "react-router-dom";
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
  Spin,
} from "antd";

import { BookOutlined, LeftOutlined } from "@ant-design/icons";

import useLocalforageDb, {
  getOneDataByKey,
  setOneDataByKey,
  getOneData,
} from "../utils/useLocalforageDb";

import { isArrayNonEmpty } from "../utils/arrayFunc";
import {
  saveOneData,
  saveListData,
  clearStore,
} from "../utils/useLocalforageDb";

import { getReviewDates } from "../utils/studyCommon";

import axios from "axios";

import "./BookSelect.css";

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
  isKnown: boolean;
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
  db_key: string;
  id: string;
  title: string;
  learnDate: string; // 格式：YYYY-MM-DD
  isFinish: boolean;
}

interface ReviewItem {
  db_key: string;
  id: string;
  studyId: string;
  title: string;
  reviewDate: string; // 格式：YYYY-MM-DD
  isFinish: boolean;
}

interface projConfig {
  hasInit: boolean;
}

// 每日学习数量
type DailyCount = 20 | 30 | 40 | 50 | 60 | 70 | 80 | 100;

const BookSelect = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasScheme, setHasScheme] = useState(false);
  const [loadingContent, setLoadingContent] = useState("");

  // 新增：用ref存储数据库实例，避免重复初始化
  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));
  const juniorDbRef = useRef(useLocalforageDb("MyDb", "juniorStore"));
  const seniorDbRef = useRef(useLocalforageDb("MyDb", "seniorStore"));
  const cet4DbRef = useRef(useLocalforageDb("MyDb", "cet4Store"));
  const cet6DbRef = useRef(useLocalforageDb("MyDb", "cet6Store"));
  const kaoyanDbRef = useRef(useLocalforageDb("MyDb", "kaoyanStore"));
  const wordGroupDbRef = useRef(useLocalforageDb("MyDb", "wordGroup"));
  const schemeBriefDbRef = useRef(useLocalforageDb("MyDb", "schemeBrief"));
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));
  const reviewSchemeDbRef = useRef(useLocalforageDb("MyDb", "reviewScheme"));

  // read from db, save to array
  async function getAllDataFromStore(Db: LocalForage) {
    const dataArray: groupWord[] = [];

    try {
      // 方法一：使用 iterate (推荐，效率高)
      // iterate 接收回调函数，遍历所有键值对
      await Db.iterate((value: storedWord, index: string) => {
        // 将每一条数据构造成对象，推入数组
        // console.log(value);
        if (!value || !value["word"]) {
          //word is empty or undefined, skip this data and log error
          return;
        }

        dataArray.push({
          group: Math.floor(parseInt(index) / dailyCount) + 1, //分组
          word: value["word"],
          isKnown: false,
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
    { key: "cet4", title: "四级单词", desc: "CET-4", totalWords: 4544 },
    { key: "cet6", title: "六级单词", desc: "CET-6", totalWords: 3992 },
  ];

  // 2. 状态
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [dailyCount, setDailyCount] = useState<DailyCount>(30); //daily new words nums
  const [allData, setAllData] = useState<groupWord[]>([]);

  // 初始化 navigate 方法
  const navigate = useNavigate();

  // 3. 选择单词本 → 弹出计划
  const handleSelectBook = async (item: BookItem) => {
    if (item["key"] === "junior") {
      // console.log(item);
      // 单词进行分组, await group finish , execute show Modal
      await getAllDataFromStore(juniorDbRef.current).then((data) => {
        if (data && isArrayNonEmpty(data)) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        } else {
          bookEmptyDeal(
            "junior_data.json",
            juniorDbRef.current,
            "junior-config",
          );
        }
      });
    } else if (item["key"] === "senior") {
      await getAllDataFromStore(seniorDbRef.current).then((data) => {
        if (data && isArrayNonEmpty(data)) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        } else {
          bookEmptyDeal(
            "senior_data.json",
            seniorDbRef.current,
            "senior-config",
          );
        }
      });
    } else if (item["key"] === "cet4") {
      await getAllDataFromStore(cet4DbRef.current).then((data) => {
        if (data && isArrayNonEmpty(data)) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        } else {
          bookEmptyDeal("cet4_data.json", cet4DbRef.current, "cet4-config");
        }
      });
    } else if (item["key"] === "cet6") {
      await getAllDataFromStore(cet6DbRef.current).then((data) => {
        if (data && isArrayNonEmpty(data)) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        } else {
          bookEmptyDeal("cet6_data.json", cet6DbRef.current, "cet6-config");
        }
      });
    } else if (item["key"] === "kaoyan") {
      await getAllDataFromStore(kaoyanDbRef.current).then((data) => {
        if (data && isArrayNonEmpty(data)) {
          setSelectedBook({ ...item, totalWords: data.length });
          setAllData(data);
        } else {
          bookEmptyDeal(
            "kaoyan_data.json",
            kaoyanDbRef.current,
            "kaoyan-config",
          );
        }
      });
    } else {
      console.log(item["key"]);
      return;
    }

    setDailyCount(50);
    setPlanModalVisible(true);
  };

  // 4. 计算学习完成天数
  //dailyCount change lead to BookSelect reload,totalDays will be update new value.
  const totalWords = allData.length || 0;
  const totalDays = Math.ceil(totalWords / dailyCount);

  // 5. 确认计划
  const handleConfirmPlan = async () => {
    setLoading(true); // 计划生成开始，开启加载状态。
    setLoadingContent("生成计划中。。。");
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
      await clearStore(schemeBriefDbRef.current);
      await saveOneData(schemeBriefDbRef.current, mySchemeBrief);
    } catch (err) {
      // pop windows , prompt try again
      console.log("SchemeBrief", err);
    }

    // group words
    await clearStore(wordGroupDbRef.current);
    await saveListData<groupWord>(wordGroupDbRef.current, allData);

    // 每天学习数据的构造
    const n: number = totalDays; // 假设循环 5 次
    let schemeArr: StudyItem[] = [];
    // create new scheme must clear userScheme db at first.
    // real 学习数据
    schemeArr = Array.from({ length: n }, (_, index) => ({
      db_key: "",
      id: (index + 1).toString(), // index 从 0 开始，所以 +1
      title: `单词 Day ${index + 1}`,
      learnDate: dayjs().add(index, "day").format("YYYY-MM-DD"),
      isFinish: false,
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
        db_key: "",
        id: (index + 1).toString(),
        studyId: item.id,
        title: item.title,
        reviewDate: date, // 这里使用 reviewDate 作为新字段名
        isFinish: false,
      }));
    });
    await clearStore(reviewSchemeDbRef.current);
    await saveListData<ReviewItem>(reviewSchemeDbRef.current, resultArr);
    setLoading(false); // 计划生成完成，关闭加载状态。
    // message.success(
    //   `已选择：${selectedBook?.title}，每天 ${dailyCount} 个，共 ${totalDays + 21} 天完成！`,
    // );

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
    navigate("/book");
  };

  /**
   * if book is empty, get book from json
   * @param bookName example: cet6_data.json
   * @param Db
   * @param configName  example: cet6-config
   */
  const bookEmptyDeal = async (
    bookName: string,
    Db: LocalForage,
    configName: string,
  ) => {
    console.log("111");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLoadingContent("获取单词中。。。");
    await getJsonBook(bookName, Db, configName);

    setLoading(false);
    console.log("222");
    // navigate("/book");
  };

  /**
   * @description get word book
   * @param bookName  example: cet6_data.json
   * @param Db database
   * @param configName database config item  example: cet6-config
   */
  const getJsonBook = async (
    bookName: string,
    Db: LocalForage,
    configName: string,
  ) => {
    await axios
      .get(bookName)
      .then((response) => {
        // console.log("333", response);
        // judge data is array and not empty, return true, else false
        if (isArrayNonEmpty(response.data) === false) {
          throw new Error("***_data.json is empty");
        }

        // throw new Error("模拟错误123123");
        return importJsonData(response.data, Db).then((res) => {
          // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
          if (res === false) {
            throw new Error("***_data导入失败666");
          }
        });
      })
      .catch((error) => {
        console.log("***_data出错:", error);
        setError(configName + "数据初始化失败，请刷新重试！");
      });
  };

  useEffect(() => {
    let hasScheme: boolean = false;
    // check if has schemeBrief data in db, if not, navigate to book select page, else navigate to daytask page.
    getOneData(schemeBriefDbRef.current).then((scheme) => {
      if (scheme) {
        hasScheme = true;
      } else {
        hasScheme = false;
      }
      setHasScheme(hasScheme);
    });
    let hasInit: boolean = false;
    getOneDataByKey(configDbRef.current, "prj-config").then((config) => {
      // console.log("11111", config);
      if (config) {
        hasInit = (config as projConfig)["hasInit"];
      }
      if (hasInit === true) {
        setLoading(false);
      }

      // console.log("12222", hasInit);
      if (hasInit === false) {
        //set hasInit to true , then catch error,set hasInit to false.
        setOneDataByKey(configDbRef.current, "prj-config", {
          hasInit: true,
        });
        setLoading(false);
        // set voice default is off
        setOneDataByKey(configDbRef.current, "sound-config", "off");

        // 路径直接以 / 开头，指向 public 目录
        try {
          // save junior high data to db
          // axios
          //   .get("junior_data.json")
          //   .then((response) => {
          //     // console.log("333", response);
          //     // judge data is array and not empty, return true, else false
          //     if (isArrayNonEmpty(response.data) === false) {
          //       throw new Error("***_data.json is empty");
          //     }
          //     // throw new Error("模拟错误123123");
          //     return importJsonData(response.data, juniorDbRef.current).then(
          //       (res) => {
          //         // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
          //         if (res === false) {
          //           throw new Error("***_data导入失败666");
          //         }
          //       },
          //     );
          //   })
          //   .catch((error) => {
          //     console.log("***_data出错:", error);
          //     setOneDataByKey(configDbRef.current, "prj-config", {
          //       hasInit: false,
          //     });
          //     setError("数据初始化失败，请刷新重试！");
          //   });
          // // save senior high data to db
          // axios
          //   .get("senior_data.json")
          //   .then((response) => {
          //     // console.log("333", response);
          //     // judge data is array and not empty, return true, else false
          //     if (isArrayNonEmpty(response.data) === false) {
          //       throw new Error("***_data.json is empty");
          //     }
          //     // throw new Error("模拟错误123123");
          //     return importJsonData(response.data, seniorDbRef.current).then(
          //       (res) => {
          //         // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
          //         if (res === false) {
          //           throw new Error("***_data导入失败666");
          //         }
          //       },
          //     );
          //   })
          //   .catch((error) => {
          //     console.log("***_data出错:", error);
          //     setOneDataByKey(configDbRef.current, "prj-config", {
          //       hasInit: false,
          //     });
          //     setError("数据初始化失败，请刷新重试！");
          //   });
          // save CET4 data to db
          // axios
          //   .get("cet4_data.json")
          //   .then((response) => {
          //     // console.log("333", response);
          //     // judge data is array and not empty, return true, else false
          //     if (isArrayNonEmpty(response.data) === false) {
          //       throw new Error("***_data.json is empty");
          //     }
          //     // throw new Error("模拟错误123123");
          //     return importJsonData(response.data, cet4DbRef.current).then(
          //       (res) => {
          //         setLoading(false); // 数据初始化完成，关闭加载状态。
          //         // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
          //         if (res === false) {
          //           throw new Error("***_data导入失败666");
          //         }
          //       },
          //     );
          //   })
          //   .catch((error) => {
          //     console.log("***_data出错:", error);
          //     setOneDataByKey(configDbRef.current, "prj-config", {
          //       hasInit: false,
          //     });
          //     setError("数据初始化失败，请刷新重试！");
          //   });
          // save CET6 data to db
          // save kaoyan data to db
          // axios
          //   .get("kaoyan_data.json")
          //   .then((response) => {
          //     // console.log("333kaoyan", response);
          //     // judge data is array and not empty, return true, else false
          //     if (isArrayNonEmpty(response.data) === false) {
          //       throw new Error("***_data.json is empty");
          //     }
          //     // throw new Error("模拟错误123123");
          //     return importJsonData(response.data, kaoyanDbRef.current).then(
          //       (res) => {
          //         setLoading(false); // 数据初始化完成，关闭加载状态。这个数据量最大，等它最后加载完成再关闭loading。也可以放在每个数据的then里，但可能会提前关闭loading。
          //         // save data to db success, res is true, else false. if false, set hasInit to false, avoid repeat import.
          //         if (res === false) {
          //           throw new Error("***_data导入失败666");
          //         }
          //       },
          //     );
          //   })
          //   .catch((error) => {
          //     console.log("***_data出错:", error);
          //     setOneDataByKey(configDbRef.current, "prj-config", {
          //       hasInit: false,
          //     });
          //     setError("数据初始化失败，请刷新重试！");
          //   });
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
      <Spin spinning={loading} fullscreen>
        {loadingContent}
      </Spin>
      {hasScheme === true && (
        <Space
          orientation="horizontal"
          size="large"
          style={{
            display: "flex",
            marginBottom: 20,
            justifyContent: "space-between",
          }}
        >
          <Link to="/setting">
            <LeftOutlined />
            返回
          </Link>
        </Space>
      )}
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
              计划天数：<strong>{totalDays + 15}</strong> 天
            </p>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default BookSelect;
