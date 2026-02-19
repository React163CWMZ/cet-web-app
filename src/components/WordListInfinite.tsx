import React, { useState, useEffect, useRef } from "react";
import { Flex, Card, Spin, Typography, Space } from "antd";
import useLocalforageDb from "../utils/useLocalforageDb";
const { Text } = Typography;

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

// 定义一个“单词穷尽”异常
class WordEndException extends Error {
  constructor(msg: string) {
    // 调用父类构造函数，设置 message
    super(`单词穷尽${msg}`);

    // 设置错误名称，便于识别
    this.name = "WordEndException";
  }
}

const WordListInfinite: React.FC<WordListProps> = () => {
  // 3. 为 state 添加类型：WordItem 数组
  const [data, setData] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

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
    // fetchData will be called again, after previous fetchData() completed.
    // strict mode, fetchData must be called twice .
    let aa = async () => {
      await fetchData();
    };
    aa();
  }, []);

  // 5. 为滚动事件添加类型 React.UIEvent<HTMLDivElement>
  const handleScroll = (e: React.UIEvent<HTMLDivElement>): void => {
    const { scrollTop, scrollHeight, clientHeight } =
      e.target as HTMLDivElement;
    // console.log(scrollTop, clientHeight, scrollHeight);
    if (scrollTop + clientHeight >= scrollHeight - 20 && !loading && hasMore) {
      fetchData();
    }
  };

  return (
    <Card title="单词列表 (上拉加)" style={{ width: "100%", marginTop: 16 }}>
      <div
        onScroll={handleScroll}
        style={{
          height: "600px",
          overflowY: "auto",
          padding: "6px 0px 0px 0px",
          border: "1px solid #f0f0f0",
          borderRadius: 8,
        }}
      >
        <Flex
          vertical
          gap="small"
          style={{
            padding: "0 6px",
          }}
        >
          {data.map((item, index) => (
            <Card
              key={item.id}
              size="small"
              style={{ backgroundColor: "#fafafa" }}
              styles={{}}
            >
              <Text strong>{item.word}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {item.meaning}
              </Text>
            </Card>
          ))}
        </Flex>
        <Spin spinning={loading} size="small" tip="加载中...">
          <Flex justify="center" align="center" style={{ padding: "16px 0" }}>
            {loading ? (
              <Space />
            ) : !hasMore ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                —— 已经到底啦 ——
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
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
