import React, { useState, useRef, useEffect } from "react";
import { Calendar, Badge } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import StudyTaskCard from "./StudyTaskCard";
import useLocalforageDb, {
  getOneData,
  getAllDataFromStore,
} from "../utils/useLocalforageDb";
import { getReviewDates } from "../utils/studyCommon";

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

interface SchemeBrief {
  key?: string;
  book?: string;
  wordsGroup: number;
  groupNums: number;
  startDay?: string;
}

const EbbinghausCalendar: React.FC<SchemeBrief> = () => {
  // console.log(book, wordsGroup, groupNums);

  const [schemeList, setSchemeList] = useState<StudyItem[]>([]);
  // let mySchemeBrief: SchemeBrief | null = null;
  const SchemeBriefDbRef = useRef(useLocalforageDb("MyDb", "schemeBrief"));
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));
  const reviewSchemeDbRef = useRef(useLocalforageDb("MyDb", "reviewScheme"));
  try {
    getOneData(SchemeBriefDbRef.current).then((data) => {
      if (data) {
        // mySchemeBrief = data as SchemeBrief;
      }
    });
  } catch (err) {
    // pop windows , prompt try again
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
  const [selectedReview, setSelectedReview] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const pageInit = async () => {
      // 获取学习scheme数据
      let schemeArr: StudyItem[] = [];

      let reviewArr: ReviewItem[] = [];

      try {
        // get scheme from db
        schemeArr = await getAllDataFromStore<StudyItem>(
          userSchemeDbRef.current,
        );
        setSchemeList(schemeArr);
        // get today learn
        setSelectedLearn(
          schemeArr.filter((item) => item.learnDate === selectedDay),
        );
      } catch (err) {
        console.log("7777", (err as Error).message);
        // tip user data except
      }

      // console.log(schemeArr, nextLearn);
      try {
        // get scheme from db
        reviewArr = await getAllDataFromStore<ReviewItem>(
          reviewSchemeDbRef.current,
        );

        // get today review
        setSelectedReview(
          reviewArr.filter((item) => item.reviewDate === selectedDay),
        );
      } catch (err) {
        console.log("7878", (err as Error).message);
        // tip user data except
      }
    };

    pageInit();
  }, [userSchemeDbRef, reviewSchemeDbRef, selectedDay]);

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
