import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flex,
  Card,
  Spin,
  Typography,
  Space,
  Row,
  Col,
  Button,
  Checkbox,
  message,
  Modal,
} from "antd";
import useLocalforageDb, { getOneDataByKey } from "../utils/useLocalforageDb";
import { arrayDiff } from "../utils/arrayFunc";
const { Text } = Typography;

// 引入模块化样式
import mystyles from "./WordList.module.css";

// 引入内联样式（也可抽离为单独的 CSS 文件）
const styles = {
  // 外层滚动容器样式
  scrollContainer: {
    width: "100%",
    maxHeight: "calc(100vh - 25vh)",
    overflow: "auto",
    // height: "600px",

    padding: "0px 0px 0px 0px",
    border: "1px solid #fafafa", //
    borderRadius: 8,
    // 基础样式
    "&::WebkitScrollbar": {
      width: "6px", // 竖滚动条宽度
      height: "6px", // 横滚动条高度
    },
    // 滚动条轨道
    "&::WebkitScrollbarTrack": {
      background: "#f5f7fa",
      borderRadius: "3px",
    },
    // 滚动条滑块
    "&::WebkitScrollbarThumb": {
      background: "#d1d9e6",
      borderRadius: "3px",
      transition: "background 0.2s ease",
    },

    // 滑块 hover 状态
    "&::WebkitScrollbarThumb:hover": {
      background: "#1677ff", // 呼应表头主色
    },
    "&::WebkitScrollbarThumb:active": {
      background: "#86bfff",
    },
    // Firefox 兼容
    scrollbarWidth: "thin",
    scrollbarColor: "#d1d9e6 #f5f7fa",
  } as React.CSSProperties,

  // 保留其他原有样式...
};

// 1. 定义单词数据的接口
interface WordItem {
  id: number;
  word: string;
  meaning: string;
}

interface storedWord {
  word: string;
  translations: string;
}
interface TranslationsItem {
  translation: string; // 对应 "能力，能耐；才能"
  type: string; // 对应 "n" (词性)
}

// word data with group
interface groupWord {
  group: number;
  word: string;
  isKnown: boolean;
}

// 2. 定义组件的 Props (如果需要的话)
interface WordListProps {
  // 例如: initialPage?: number;
}

// 中文释义
function connectTranslations(translations: TranslationsItem[]): string {
  let str: string = "";
  for (const [index, value] of translations.entries()) {
    str += value.translation + " " + value.type;
    if (index !== translations.length - 1) {
      str += " | ";
    }
  }
  return str;
}

//// 定义一个“单词穷尽”异常
// class WordEndException extends Error {
//   constructor(msg: string) {
//     // 调用父类构造函数，设置 message
//     super(`单词穷尽${msg}`);

//     // 设置错误名称，便于识别
//     this.name = "WordEndException";
//   }
// }

const WordList: React.FC<WordListProps> = () => {
  const navigate = useNavigate();
  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    saveLearn();
    setIsModalOpen(false);
    navigate("/study");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 为 state 添加类型：WordItem 数组
  const [data, setData] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // had known words
  const known_words = useRef<string[]>([]);

  // pop massage
  const [messageApi, contextHolder] = message.useMessage();

  // 选中的ID集合
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // 单个切换
  const toggleItem = (word: string) => {
    if (checkedIds.includes(word)) {
      setCheckedIds(checkedIds.filter((i) => i !== word));
      // delete word
      known_words.current = known_words.current.filter((item) => item !== word);
    } else {
      setCheckedIds([...checkedIds, word]);
      // add to need learn
      known_words.current.push(word);
    }
  };

  // 1. 判断“半选”状态 (有数据选中，但不是全部)
  const indeterminate =
    checkedIds.length > 0 && checkedIds.length < data.length;

  // 2. 全选 / 取消全选
  const toggleAll = (checked: boolean) => {
    if (checked) {
      setCheckedIds(data.map((item) => item.word));
      // 全选时，known_words 就是所有单词
      known_words.current = data.map((item) => item.word);
    } else {
      setCheckedIds([]);
      // 取消全选时，known_words 也清空
      known_words.current = [];
    }
  };

  // 是否全选
  const isAllChecked = data.length > 0 && checkedIds.length === data.length;

  // save need learn word to database
  const saveLearn = async () => {
    const judged_words = data.map((obj: WordItem) => obj.word);
    // the words need to learn = judged - known_words
    const learn_words = arrayDiff<string>(judged_words, known_words.current);
    console.log(learn_words, judged_words, known_words.current);

    const Db = juniorGroupDbRef.current;

    try {
      if (learn_words.length < 3) {
        throw new Error("一组学习的单词至少3个哦~");
      }
      let group = await getOneDataByKey(configDbRef.current, "cur_group");

      // iterate 接收回调函数，遍历所有键值对
      await Db.iterate((value: groupWord, key) => {
        // 将每一条数据构造成对象，推入数组

        if (value["group"] === group && learn_words.includes(value["word"])) {
          value = { ...value, isKnown: false };
          Db.setItem(key, value);
        }

        if (
          value["group"] === group &&
          known_words.current.includes(value["word"])
        ) {
          value = { ...value, isKnown: true };
          Db.setItem(key, value);
        }

        // 注意：在 iterate 中不能使用 return 来中断（除非抛出异常），它是同步遍历
      });
    } catch (err) {
      console.error("更新数据失败:", err);
      messageApi.info(err instanceof Error ? err.message : "操作失败");
    }
  };

  // 新增：异步请求锁 - 标记是否有请求正在处理中（比loading更及时）
  // 用 useRef 存储，不触发重渲染, speed more
  const requestLock = useRef<boolean>(false);
  // 新增：用ref存储数据库实例，避免重复初始化

  const juniorDbRef = useRef(useLocalforageDb("MyDb", "juniorStore"));

  const juniorGroupDbRef = useRef(useLocalforageDb("MyDb", "juniorGroup"));

  async function getGroupDataFromStore(Db: LocalForage) {
    let dataArray: groupWord[] = [];

    try {
      let group = await getOneDataByKey(configDbRef.current, "cur_group");
      // iterate 接收回调函数，遍历所有键值对
      await Db.iterate((value: groupWord) => {
        // 将每一条数据构造成对象，推入数组

        if (value["group"] === group) {
          dataArray.push(value);
        }

        // 注意：在 iterate 中不能使用 return 来中断（除非抛出异常），它是同步遍历
      });

      // console.log(group, "获取到的数据数组:", dataArray);
      return dataArray;
    } catch (err) {
      console.error("读取数据失败:", err);
    }
  }

  // 模拟数据获取 - 添加返回类型 Promise<void>
  const fetchData = async (data: string[]): Promise<void> => {
    // 第一层拦截：请求锁 + loading + 无更多数据（三重防护）
    if (requestLock.current || loading) return;
    // 加锁：在异步逻辑前就锁住，杜绝重复调用
    requestLock.current = true;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const juniorDB = juniorDbRef.current;
      let mockData: WordItem[] = [];
      let storedData: storedWord | null = null;
      let word: WordItem | null = null;
      let someTemp: unknown; // make error of type vanish

      for (let i = 0; i < data.length; i++) {
        storedData = await juniorDB.getItem(data[i]);
        // console.log("ddd", storedData);
        if (storedData) {
          someTemp = storedData["translations"];
          word = {
            id: i,
            word: storedData["word"] ? storedData["word"] : "",
            meaning: storedData["translations"]
              ? connectTranslations(someTemp as Array<TranslationsItem>)
              : "",
          };
          // console.log("ddd", word);
          mockData.push(word);
        }
      }

      // 4. 这里就是你要的 TS 写法，TypeScript 能自动推断出 prev 是 WordItem[]
      setData(mockData);
    } catch (err) {
      // // according to this exception, next page or end fetch
      // if (err instanceof WordEndException) {
      //   setHasMore(false);
      // }
      console.error(err);
    } finally {
      // 解锁 + 关闭加载状态（无论成功/失败都执行）
      requestLock.current = false;
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    async function initFetch() {
      let groupData = await getGroupDataFromStore(
        juniorGroupDbRef.current,
      ).then((res) => {
        return res;
      });
      // console.log("groupData:", groupData);
      if (groupData) {
        let known_words_temp: string[] = [];
        let group_words_temp: string[] = [];
        groupData.forEach((item) => {
          if (item["isKnown"] === true) {
            known_words_temp.push(item["word"]);
          }
          group_words_temp.push(item["word"]);
        });

        known_words.current = known_words_temp;
        setCheckedIds(known_words.current); // 初始化时select（即已知的单词）
        await fetchData(group_words_temp);
      }
    }

    initFetch();
  }, []);

  return (
    <Card
      title={
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span>单词列表</span>
            <Button type="dashed" onClick={showModal} size="small">
              完成
            </Button>
            <Modal
              title="保存"
              closable={{ "aria-label": "Custom Close Button" }}
              open={isModalOpen}
              onOk={handleOk}
              onCancel={handleCancel}
            >
              <p>确定保存吗</p>
            </Modal>
          </div>
        </>
      }
      style={{ width: "100%", marginTop: 16, backgroundColor: "#fff" }}
      styles={{
        header: {
          background: "#1677ff", // 顶部蓝色
          color: "#fff",
          fontSize: "16px",
          fontWeight: 500,
        },
        body: {
          border: "1px solid #1677ff",
          borderTop: 0,
          padding: "3px 8px",
          minHeight: "80vh",
          backgroundColor: "#f8fafc", // 淡蓝色背景
          // boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <div
        style={{
          padding: "8px 0",
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <span style={{ color: "#f97316", fontSize: 14, margin: "0 auto" }}>
          提示：选中已经熟知的单词，这些单词就不会加入学习计划。
        </span>
        {contextHolder}
        {/* 全选框 */}
        <Checkbox
          indeterminate={indeterminate}
          checked={isAllChecked}
          onChange={(e) => toggleAll(e.target.checked)}
          style={{ marginLeft: "auto" }}
        >
          全选
        </Checkbox>
      </div>

      <div style={styles.scrollContainer}>
        <Flex
          vertical
          gap="small"
          style={{
            padding: "6px 0 0 6px",
            backgroundColor: "#f8fafc",
          }}
        >
          {data.map((item) => (
            <Card
              key={item.word}
              size="small"
              style={{
                backgroundColor: "#f6f6f6",
                transition: "background 0.2s",
              }}
              className={`${mystyles.card} ${checkedIds.includes(item.word) ? "cardChecked" : ""}`}
              // hover 样式
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fff0f5"; // hover 背景色
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f6f6f6"; // 恢复默认背景
              }}
            >
              <Row
                justify="space-between"
                align="middle"
                style={{ width: "100%" }}
              >
                <Col>
                  <Text strong style={{ color: "#1e293b" }}>
                    {item.word}
                  </Text>
                </Col>
                <Col>
                  <Text
                    type="secondary"
                    style={{
                      marginLeft: 8,
                      color: "#64748b",
                    }}
                  >
                    {item.meaning}
                  </Text>
                </Col>
                <Col>
                  <Space align="end">
                    <Checkbox
                      checked={checkedIds.includes(item.word)}
                      onChange={() => toggleItem(item.word)}
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Flex>
        <Spin spinning={loading}></Spin>
      </div>
    </Card>
  );
};

export default WordList;
