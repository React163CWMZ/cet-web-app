import dayjs from "dayjs";

// 艾宾浩斯复习天数（只按天）,first review is the same day of learn date
export const REVIEW_DAYS = [0, 1, 2, 4, 6, 9, 14, 21];

// 工具函数：计算复习日期
export function getReviewDates(learnDate: string): string[] {
  return REVIEW_DAYS.map((day) =>
    dayjs(learnDate).add(day, "day").format("YYYY-MM-DD"),
  );
}
