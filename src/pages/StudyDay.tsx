import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import StudyTaskCard from "../components/StudyTaskCard";
import useLocalforageDb, { getOneData } from "../utils/useLocalforageDb";

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

interface SchemeList {
  id: string;
  title: string;
  learnDate: string;
}

// 艾宾浩斯复习天数（只按天）,first review is the same day of learn date
const REVIEW_DAYS = [0, 1, 3, 6, 14, 21, 29];

// 工具函数：计算复习日期
function getReviewDates(learnDate: string): string[] {
  return REVIEW_DAYS.map((day) =>
    dayjs(learnDate).add(day, "day").format("YYYY-MM-DD"),
  );
}

const StudyDay = () => {
  const navigate = useNavigate();

  // 引入 useLocation 钩子接收参数
  const location = useLocation();
  //解构参数（加类型注解更规范）
  // const { wordBook, dailyCount, totalDays, startDay } = location.state || {};
  // const name: string = wordBook?.title;

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
  // 每天学习数据的构造
  // const n: number = groupNums; // 假设循环 5 次
  let schemeArr: StudyItem[] = [];

  const [studyList, setStudyList] = useState<StudyItem[]>(schemeArr);
  // get scheme from db
  getSchemeData(userSchemeDbRef.current).then((data) => {
    if (data) {
      schemeArr = data;
      setStudyList(schemeArr);
    } else {
      // throw new error
    }
  });

  async function getSchemeData(Db: LocalForage) {
    const result: StudyItem[] = [];
    try {
      await Db.iterate((values: StudyItem, key) => {
        result.push(values);
      });
      return result; // 数据拿到后再执行后续逻辑
    } catch (err) {
      console.error("读取失败", err);
    }
  }
  // 选中日期状态;
  const [selectedDay, setSelectedDay] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );

  // 计算选中日期的任务
  const selectedLearn = studyList.filter(
    (item) => item.learnDate === selectedDay,
  );
  const selectedReview = studyList.filter((item) =>
    new Set(getReviewDates(item.learnDate)).has(selectedDay),
  );

  // 页面布局
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <h2>
        📅 学习计划:
        <span>{mySchemeBriefRef.current?.book}</span>
        <span>开始日期：{mySchemeBriefRef.current?.startDay}</span>
        <span>预计天数：{mySchemeBriefRef.current?.groupNums} 天</span>
      </h2>

      <div style={{ display: "flex", gap: 20 }}>
        {/* 左侧日历 */}

        {/* 右侧任务卡片（子组件） */}
        <div style={{ flex: 1 }}>
          <StudyTaskCard
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
