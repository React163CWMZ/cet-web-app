import React, { useState, useRef } from "react";
import { Calendar, Badge } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import StudyTaskCard from "./StudyTaskCard";
import useLocalforageDb from "../utils/useLocalforageDb";
import { isArrayNonEmpty } from "../utils/arrayFunc";
import { getOneData } from "../utils/useLocalforageDb";

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

const EbbinghausCalendar: React.FC<SchemeBrief> = ({
  book,
  wordsGroup,
  groupNums,
  startDay,
}) => {
  dayjs.locale("zh-CN");
  // console.log(book, wordsGroup, groupNums);

  let mySchemeBrief: SchemeBrief | null = null;
  const SchemeBriefDbRef = useRef(useLocalforageDb("MyDb", "SchemeBrief"));
  try {
    getOneData(SchemeBriefDbRef.current).then((data) => {
      if (data) {
        mySchemeBrief = data as SchemeBrief;
      }
    });
  } catch (err) {
    // pop windows , prompt try again
  }

  // 新增：用ref存储数据库实例，避免重复初始化
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));
  // 每天学习数据的构造
  const n: number = groupNums; // 假设循环 5 次
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

  // 选中日期状态
  const [selectedDay, setSelectedDay] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );

  // 日历单元格渲染逻辑
  const cellRender: CalendarProps<Dayjs>["cellRender"] = (
    date: Dayjs,
    info,
  ) => {
    // info.type 可以区分单元格类型：date（日期）、month（月份）、year（年份）等
    if (info.type === "date") {
      // 这里实现原 dateCellRender 的逻辑
    }
    const today = date.format("YYYY-MM-DD");
    const todayLearn = studyList.filter((item) => item.learnDate === today);
    const todayReview = studyList.filter((item) =>
      getReviewDates(item.learnDate).includes(today),
    );

    return (
      <div style={{ padding: 4 }}>
        {todayLearn.length > 0 && (
          <Badge
            color="blue"
            text={
              <>
                <span style={{ fontSize: 10 }}>新学：{todayLearn.length}</span>
              </>
            }
            style={{ fontSize: 12 }}
          />
        )}
        <br />
        {todayReview.length > 0 && (
          <Badge
            color="orange"
            text={
              <span style={{ fontSize: 10 }}>复习：{todayReview.length}</span>
            }
            style={{ fontSize: 12 }}
          />
        )}
      </div>
    );
  };

  // 日期选择事件
  const onSelect = (value: Dayjs) => {
    setSelectedDay(value.format("YYYY-MM-DD"));
  };

  // 计算选中日期的任务
  const selectedLearn = studyList.filter(
    (item) => item.learnDate === selectedDay,
  );
  const selectedReview = studyList.filter((item) =>
    getReviewDates(item.learnDate).includes(selectedDay),
  );

  // 页面布局
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <h2>📅 学习计划日历</h2>
      <div style={{ display: "flex", gap: 20 }}>
        {/* 左侧日历 */}
        <div style={{ flex: 2 }}>
          <Calendar
            cellRender={cellRender}
            onSelect={onSelect}
            value={dayjs(selectedDay)}
          />
        </div>
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

export default EbbinghausCalendar;
