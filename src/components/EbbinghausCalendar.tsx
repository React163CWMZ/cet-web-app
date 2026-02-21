import React, { useState } from "react";
import { Calendar, Badge } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import StudyTaskCard from "./StudyTaskCard";

// 类型定义
interface StudyItem {
  id: string;
  title: string;
  learnDate: string; // 格式：YYYY-MM-DD
}

// 艾宾浩斯复习天数（只按天）,first review is the same day of learn date
const REVIEW_DAYS = [0, 1, 3, 6, 14, 21, 29];

// 工具函数：计算复习日期
function getReviewDates(learnDate: string): string[] {
  return REVIEW_DAYS.map((day) =>
    dayjs(learnDate).add(day, "day").format("YYYY-MM-DD"),
  );
}

const EbbinghausCalendar: React.FC = () => {
  dayjs.locale("zh-CN");

  // 每天学习数据的构造

  const n: number = 5; // 假设循环 5 次
  let arr: StudyItem[] = [];

  // real 学习数据
  arr = Array.from({ length: n }, (_, index) => ({
    id: (index + 1).toString(), // index 从 0 开始，所以 +1
    title: `单词 Day ${index + 1}`,
    learnDate: dayjs().add(index, "day").format("YYYY-MM-DD"),
  }));
  const [studyList] = useState<StudyItem[]>(arr);
  // 模拟学习数据
  // const [studyList] = useState<StudyItem[]>([
  //   { id: "1", title: "单词 Unit 1", learnDate: "2026-02-20" },
  //   { id: "2", title: "单词 Unit 2", learnDate: "2026-02-21" },
  //   { id: "3", title: "单词 Unit 3", learnDate: "2026-02-22" },
  //   { id: "4", title: "单词 Unit 4", learnDate: "2026-02-23" },
  // ]);

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
