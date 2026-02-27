import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import StudyTaskCard from "../components/StudyTaskCard";
import useLocalforageDb, { getOneData } from "../utils/useLocalforageDb";
import { getReviewDates } from "../utils/studyCommon";
import { Space } from "antd";
import { Link, useLocation } from "react-router-dom";

// study scheme 类型定义
interface StudyItem {
  id: string;
  title: string;
  learnDate: string; // 格式：YYYY-MM-DD
}

interface SchemeBrief {
  book: string;
  wordsGroup: number;
  groupNums: number;
  startDay?: string;
}

const StudyDay = () => {
  // const navigate = useNavigate();

  // 引入 useLocation 钩子接收参数
  const location = useLocation();
  //解构参数（加类型注解更规范）
  // const { wordBook, dailyCount, totalDays, startDay } = location.state || {};
  // const name: string = wordBook?.title;

  const [selectedLearn, setSelectedLearn] = useState<StudyItem[]>([]);
  const [selectedReview, setSelectedReview] = useState<StudyItem[]>([]);
  // 选中日期状态;默认是今天
  const [selectedDay] = useState<string>(dayjs().format("YYYY-MM-DD"));

  const mySchemeBriefRef = useRef<SchemeBrief>(null);
  const SchemeBriefDbRef = useRef(useLocalforageDb("MyDb", "SchemeBrief"));
  try {
    getOneData(SchemeBriefDbRef.current).then((data) => {
      if (data) {
        mySchemeBriefRef.current = data as SchemeBrief;
      }
    });
  } catch (err) {
    // pop windows , prompt try again
  }

  // 新增：用ref存储数据库实例，避免重复初始化
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));

  async function getSchemeData(Db: LocalForage) {
    const result: StudyItem[] = [];
    try {
      await Db.iterate((values: StudyItem) => {
        result.push(values);
      });
      return result; // 数据拿到后再执行后续逻辑
    } catch (err) {
      console.error("读取失败", err);
    }
  }

  useEffect(() => {
    // 每天学习数据的构造
    let schemeArr: StudyItem[] = [];

    // get scheme from db
    getSchemeData(userSchemeDbRef.current).then((data) => {
      if (data) {
        schemeArr = data;

        // setSelectedDay(dayjs().format("YYYY-MM-DD"));
        // 计算选中日期的任务
        setSelectedLearn(
          schemeArr.filter((item) => item.learnDate === selectedDay),
        );

        setSelectedReview(
          schemeArr.filter((item) =>
            new Set(getReviewDates(item.learnDate)).has(selectedDay),
          ),
        );
      } else {
        // throw new error
      }
    });
  }, []);

  // // 获取昨天的日期
  // const [yesterDay, setYesterDayDay] = useState<string>(
  //   dayjs().subtract(1, "day").format("YYYY-MM-DD"),
  // );

  // // 计算选中日期的任务
  // const yesterLearn = studyList.filter((item) => item.learnDate === yesterDay);
  // const yesterReview = studyList.filter((item) =>
  //   new Set(getReviewDates(item.learnDate)).has(yesterDay),
  // );

  // // 获取明天的日期
  // const [tomorrowDay, setTomorrowDay] = useState<string>(
  //   dayjs().add(1, "day").format("YYYY-MM-DD"),
  // );

  // // 计算选中日期的任务
  // const tomorrowLearn = studyList.filter(
  //   (item) => item.learnDate === tomorrowDay,
  // );
  // const tomorrowReview = studyList.filter((item) =>
  //   new Set(getReviewDates(item.learnDate)).has(tomorrowDay),
  // );

  // 页面布局
  return (
    <div
      style={{
        maxWidth: "100%",
        margin: "0 auto",
        padding: 20,
        backgroundColor: "#fafafa",
      }}
    >
      <Space
        orientation="horizontal"
        size="large"
        style={{
          display: "flex",
          marginBottom: 20,
          justifyContent: "space-between",
          fontSize: "18px",
          fontWeight: 500,
        }}
      >
        {location.pathname === "/daytask" ? (
          <span style={{ color: "#1e293b" }}>学习日程</span>
        ) : (
          <Link to="/daytask">学习日程</Link>
        )}

        <Link to="/setting">关于设置</Link>
      </Space>
      <Space
        orientation="horizontal"
        size="large"
        style={{ display: "flex", marginBottom: 20, color: "#334155" }}
      >
        <span>📅 学习计划：{mySchemeBriefRef.current?.book}</span>
        <span>开始日期：{mySchemeBriefRef.current?.startDay}</span>
        <span>预计天数：{mySchemeBriefRef.current?.groupNums} 天</span>
      </Space>

      <div style={{ display: "flex", gap: 20 }}>
        {/* 右侧任务卡片（子组件） */}
        <div style={{ flex: 1 }}>
          <StudyTaskCard
            isActive={true}
            selectedDay={selectedDay}
            learnTasks={selectedLearn}
            reviewTasks={selectedReview}
          />
        </div>
      </div>
    </div>
  );
};

export default StudyDay;
