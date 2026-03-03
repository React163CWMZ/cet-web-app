import React, { useState, useRef, useEffect } from "react";
import { Calendar, Badge } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import StudyTaskCard from "./StudyTaskCard";
import useLocalforageDb, { getOneData } from "../utils/useLocalforageDb";
import { getReviewDates } from "../utils/studyCommon";

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

const EbbinghausCalendar: React.FC<SchemeBrief> = () => {
  // console.log(book, wordsGroup, groupNums);

  const [schemeList, setSchemeList] = useState<StudyItem[]>([]);
  // let mySchemeBrief: SchemeBrief | null = null;
  const SchemeBriefDbRef = useRef(useLocalforageDb("MyDb", "schemeBrief"));
  try {
    getOneData(SchemeBriefDbRef.current).then((data) => {
      if (data) {
        // mySchemeBrief = data as SchemeBrief;
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

  // 日历单元格渲染逻辑
  const cellRender: CalendarProps<Dayjs>["cellRender"] = (
    date: Dayjs,
    info,
  ) => {
    // info.type 可以区分单元格类型：date（日期）、month（月份）、year（年份）等
    if (info.type === "date") {
      // 获取学习scheme数据

      // 这里实现原 dateCellRender 的逻辑
      const today = date.format("YYYY-MM-DD");
      const todayLearn = schemeList.filter((item) => item.learnDate === today);
      const todayReview = schemeList.filter((item) =>
        new Set(getReviewDates(item.learnDate)).has(today),
      );

      return (
        <div style={{ padding: 4 }}>
          {todayLearn.length > 0 && (
            <Badge
              color="blue"
              text={
                <>
                  <span style={{ fontSize: 10 }}>
                    新学：{todayLearn.length}
                  </span>
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
    }
  };

  // 日期选择事件
  const onSelect = (value: Dayjs) => {
    setSelectedDay(value.format("YYYY-MM-DD"));
  };

  // 选中current日期状态;
  const [selectedDay, setSelectedDay] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );
  const [selectedLearn, setSelectedLearn] = useState<StudyItem[]>([]);
  const [selectedReview, setSelectedReview] = useState<StudyItem[]>([]);

  useEffect(() => {
    // 获取学习scheme数据
    let schemeArr: StudyItem[] = [];

    // get scheme from db
    getSchemeData(userSchemeDbRef.current).then((data) => {
      if (data) {
        schemeArr = data;
        setSchemeList(schemeArr);
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
  }, [userSchemeDbRef, selectedDay]);

  // 页面布局
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <h2>📅 学习计划日历</h2>
      <div style={{ display: "flex", gap: 20 }}>
        {/* 左侧日历 */}
        <div style={{ flex: 2 }}>
          <Calendar
            style={{
              backgroundColor: "#fafafa",
            }}
            cellRender={cellRender}
            onSelect={onSelect}
            value={dayjs(selectedDay)}
          />
        </div>
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

export default EbbinghausCalendar;
