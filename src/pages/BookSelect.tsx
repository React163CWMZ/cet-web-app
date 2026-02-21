import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
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
} from "antd";

import { BookOutlined } from "@ant-design/icons";
import "./BookSelect.css";

import useLocalforageDb from "../utils/useLocalforageDb";

import { arrayShuffle } from "../utils/arrayFunc";
import {
  saveOneData,
  saveListData,
  clearStore,
} from "../utils/useLocalforageDb";

const { Title } = Typography;

// 单词级别类型
export type BookLevel = "junior" | "senior" | "cet4" | "cet6";

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
}

interface SchemeBrief {
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

// 每日学习数量
type DailyCount = 20 | 30 | 40 | 50 | 60 | 70 | 80;

const BookSelect = () => {
  // 新增：用ref存储数据库实例，避免重复初始化
  const juniorDbRef = useRef(useLocalforageDb("MyDb", "juniorStore"));
  const juniorGroupDbRef = useRef(useLocalforageDb("MyDb", "juniorGroup"));
  const SchemeBriefDbRef = useRef(useLocalforageDb("MyDb", "SchemeBrief"));
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));
  // read from db, save to array
  async function getAllDataFromStore(Db: LocalForage) {
    const dataArray: groupWord[] = [];

    try {
      // 方法一：使用 iterate (推荐，效率高)
      // iterate 接收回调函数，遍历所有键值对
      await Db.iterate((value: storedWord, key) => {
        // 将每一条数据构造成对象，推入数组

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
    { key: "junior", title: "初中单词", desc: "Junior High", totalWords: 1800 },
    { key: "senior", title: "高中单词", desc: "Senior High", totalWords: 3506 },
    { key: "cet4", title: "四级单词", desc: "CET-4", totalWords: 4500 },
    { key: "cet6", title: "六级单词", desc: "CET-6", totalWords: 5500 },
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
    } else {
      console.log(item["key"]);
      return;
    }

    setDailyCount(30);
    setPlanModalVisible(true);
  };

  // 4. 计算学习天数
  //dailyCount change lead to BookSelect reload,totalDays will be update new value.
  const totalWords = selectedBook?.totalWords || 0;
  const totalDays = Math.ceil(totalWords / dailyCount);

  // 5. 确认计划
  const handleConfirmPlan = () => {
    setPlanModalVisible(false);

    let mySchemeBrief: SchemeBrief = {
      book: selectedBook?.title,
      wordsGroup: dailyCount,
      groupNums: totalDays,
      startDay: dayjs(new Date().getTime()).format("YYYY-MM-DD"),
    };

    try {
      // clear data, then save new
      clearStore(SchemeBriefDbRef.current);
      saveOneData(SchemeBriefDbRef.current, mySchemeBrief);
    } catch (err) {
      // pop windows , prompt try again
    }

    // group words
    const result: groupWord[] = arrayShuffle(allData).map((item, index) => {
      return {
        ...item,
        group: Math.floor(index / dailyCount) + 1, // 每dailyCount个一组
      };
    });

    clearStore(juniorGroupDbRef.current);
    saveListData<groupWord>(juniorGroupDbRef.current, result);

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

    clearStore(userSchemeDbRef.current);
    // save scheme to db, review scheme gene by getReviewDates()
    saveListData<StudyItem>(userSchemeDbRef.current, schemeArr);

    message.success(
      `已选择：${selectedBook?.title}，每天 ${dailyCount} 个，共 ${totalDays} 天`,
    );

    // 这里可以跳转到背单词页面
    navigate("/calendar", {
      state: {
        wordBook: selectedBook,
        dailyCount,
        totalDays,
        startDay: "",
      },
    });
  };

  return (
    <div className="word-select-container">
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
          </Radio.Group>

          <div style={{ marginTop: 10 }}>
            <p>总单词数：{totalWords} 个</p>
            <p>
              预计学习天数：<strong>{totalDays}</strong> 天
            </p>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default BookSelect;
