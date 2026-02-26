import React, { useState, useEffect, useRef } from "react";
import { Flex, Card, Spin, Typography, Space, Row, Col, Button } from "antd";
import useLocalforageDb from "../utils/useLocalforageDb";
import { arrayDiff } from "../utils/arrayFunc";
const { Text } = Typography;

import { Checkbox } from "antd";
import type { CheckboxChangeEvent } from "antd";

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

// checkbox, auxiliary judgement which word need study, which word was already learned ago.
interface WordSelected {
  index: number;
  word: string;
  meaning?: string;
}

interface storedWord {
  word: string;
  translations: string;
}
interface TranslationsItem {
  translation: string; // 对应 "能力，能耐；才能"
  type: string; // 对应 "n" (词性)
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

const WordListInfinite: React.FC<WordListProps> = () => {
  // 3. 为 state 添加类型：WordItem 数组
  const [data, setData] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // select need learn word
  const [learn, setLearn] = useState<string[]>([]);

  // judged word from dictionary. judged = learn + known
  // const [judged, setJudged] = useState<string[]>([]);
  // add argument word:string
  type MyCheckboxProps = (e: CheckboxChangeEvent, word: WordSelected) => void;
  const onChange: MyCheckboxProps = (
    e: CheckboxChangeEvent,
    word: WordSelected,
  ) => {
    if (e.target.checked === true) {
      // add to need learn
      setLearn([...learn, word["word"]]);
    } else {
      // delete word
      setLearn(learn.filter((item) => item !== word["word"]));
    }
  };
  // save need learn word to database
  const saveLearn = () => {
    const judged_words = data.map((obj: WordItem) => obj.word);
    const known_words = arrayDiff<string>(judged_words, learn);
    console.log(learn, judged_words, known_words);
  };

  // 使用 ref 存储页码，不需要泛型，number 类型即可
  const page = useRef<number>(1);
  // 新增：异步请求锁 - 标记是否有请求正在处理中（比loading更及时）
  // 用 useRef 存储，不触发重渲染, speed more
  const requestLock = useRef<boolean>(false);
  // 新增：用ref存储数据库实例，避免重复初始化
  const juniorDbRef = useRef(useLocalforageDb("MyDb", "juniorStore"));

  // 模拟数据获取 - 添加返回类型 Promise<void>
  const fetchData = async (): Promise<void> => {
    // 第一层拦截：请求锁 + loading + 无更多数据（三重防护）
    console.log(page.current);
    if (requestLock.current || loading || !hasMore) return;
    // 加锁：在异步逻辑前就锁住，杜绝重复调用
    requestLock.current = true;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const juniorDB = juniorDbRef.current;
      // juniorDB.setItem("10000", "aaaaaa");
      let mockData: WordItem[] = [];
      let storedData: storedWord | null = null;
      let id: number = 0;
      let word: WordItem | null = null;
      let someTemp: unknown; // make error of type vanish

      for (let i = 1; i <= 20; i++) {
        id = (page.current - 1) * 20 + i;
        storedData = await juniorDB.getItem(id.toString());
        // console.log(storedData);
        if (storedData) {
          someTemp = storedData["translations"];
          word = {
            id: id,
            word: storedData["word"] ? storedData["word"] : "",
            meaning: storedData["translations"]
              ? connectTranslations(someTemp as Array<TranslationsItem>)
              : "",
          };
          mockData.push(word);
        }
      }
      //end fetch,no more word
      // last page , word number less than 20
      if (!mockData) {
        setHasMore(false);
      } else if (mockData.length < 20) {
        setHasMore(false);
      } else {
        page.current += 1;
      }

      // 4. 这里就是你要的 TS 写法，TypeScript 能自动推断出 prev 是 WordItem[]
      setData((prev) => [...prev, ...mockData]);
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
    fetchData();
  }, []);

  // 5. 为滚动事件添加类型 React.UIEvent<HTMLDivElement>
  const handleScroll = (e: React.UIEvent<HTMLDivElement>): void => {
    const { scrollTop, scrollHeight, clientHeight } =
      e.target as HTMLDivElement;
    // console.log(scrollTop, clientHeight, scrollHeight);
    if (scrollTop + clientHeight >= scrollHeight - 5 && !loading && hasMore) {
      fetchData();
    }
  };

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
            <Button type="dashed" onClick={saveLearn} size="small">
              操作
            </Button>
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

          // boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <div style={styles.scrollContainer} onScroll={handleScroll}>
        <Flex
          vertical
          gap="small"
          style={{
            padding: "6px 0 0 6px",
            backgroundColor: "#fff",
          }}
        >
          {data.map((item, index) => (
            <Card
              key={index}
              size="small"
              style={{
                backgroundColor: "#f6f6f6",
                transition: "background 0.2s",
              }}
              // hover 样式
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8f3ff"; // hover 背景色
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
                  <Text strong style={{ color: "#1d2129" }}>
                    {item.word}
                  </Text>
                </Col>
                <Col>
                  <Text
                    type="secondary"
                    style={{
                      marginLeft: 8,
                      color: "#4e5969",
                    }}
                  >
                    {item.meaning}
                  </Text>
                </Col>
                <Col>
                  <Space align="end">
                    <Checkbox
                      onChange={(e) =>
                        onChange(e, { index: index, word: item.word })
                      }
                    ></Checkbox>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Flex>
        <Spin
          spinning={loading}
          style={{ height: 40 }}
          size="small"
          tip="加载中..."
        >
          <Flex justify="center" align="center" style={{ padding: "16px 0" }}>
            {loading ? (
              <Space />
            ) : !hasMore ? (
              <Text type="secondary" style={{ height: 40, fontSize: 16 }}>
                —— 无单词或已经到底啦 ——
              </Text>
            ) : (
              <Text type="secondary" style={{ height: 40, fontSize: 16 }}>
                下拉加载更多...
              </Text>
            )}
          </Flex>
        </Spin>
      </div>
    </Card>
  );
};

export default WordListInfinite;
