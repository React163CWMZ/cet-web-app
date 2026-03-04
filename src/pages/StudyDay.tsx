import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import StudyTaskCard from "../components/StudyTaskCard";
import useLocalforageDb, {
  getOneData,
  getAllDataFromStore,
} from "../utils/useLocalforageDb";
import { Space } from "antd";
import { Link, useLocation } from "react-router-dom";

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
  const [selectedReview, setSelectedReview] = useState<ReviewItem[]>([]);

  const [nextLearn, setNextLearn] = useState<StudyItem | null>(null);
  const [nextReview, setNextReview] = useState<ReviewItem[]>([]);
  // next learnDate or reviewDate
  const [nextFirstFutureDate, setNextFirstFutureDate] = useState<string>("");

  // 选中日期状态;默认是今天
  const [selectedDay] = useState<string>(dayjs().format("YYYY-MM-DD"));

  const mySchemeBriefRef = useRef<SchemeBrief>(null);
  const SchemeBriefDbRef = useRef(useLocalforageDb("MyDb", "schemeBrief"));

  // 新增：用ref存储数据库实例，避免重复初始化
  const userSchemeDbRef = useRef(useLocalforageDb("MyDb", "userScheme"));
  const reviewSchemeDbRef = useRef(useLocalforageDb("MyDb", "reviewScheme"));

  try {
    getOneData(SchemeBriefDbRef.current).then((data) => {
      if (data) {
        mySchemeBriefRef.current = data as SchemeBrief;
      }
    });
  } catch (err) {
    // pop windows , prompt try again
  }

  /**
   * 找到比今天更晚的第一个 learnDate 对应的数组项
   * @param items 单词列表
   * @returns 第一个未来的项，没有则返回 null
   */
  function findLearnFirstFutureItem(items: StudyItem[]): StudyItem | null {
    // 获取今天的日期（不包含时分秒）
    const today = dayjs().startOf("day");

    return (
      items
        // 1. 过滤：只保留 learnDate 严格大于今天的项
        .filter((item) => dayjs(item.learnDate).isAfter(today))
        // 2. 排序：按日期升序（最近的排在前面）
        .sort((a, b) => dayjs(a.learnDate).diff(dayjs(b.learnDate)))
        // 3. 取第一个
        .at(0) || null
    );
  }

  /**
   * 找到比今天更晚的第一个 reviewDate 对应的数组项
   * @param items 单词列表
   * @returns 第一个未来的项，没有则返回 null
   */
  function findReviewFirstFutureItem(items: ReviewItem[]): ReviewItem | null {
    // 获取今天的日期（不包含时分秒）
    const today = dayjs().startOf("day");

    return (
      items
        // 1. 过滤：只保留 learnDate 严格大于今天的项
        .filter((item) => dayjs(item.reviewDate).isAfter(today))
        // 2. 排序：按日期升序（最近的排在前面）
        .sort((a, b) => dayjs(a.reviewDate).diff(dayjs(b.reviewDate)))
        // 3. 取第一个
        .at(0) || null
    );
  }

  useEffect(() => {
    const pageInit = async () => {
      // 每天学习数据的构造
      let schemeArr: StudyItem[] = [];
      let reviewArr: ReviewItem[] = [];

      try {
        // get scheme from db
        schemeArr = await getAllDataFromStore<StudyItem>(
          userSchemeDbRef.current,
        );
        // get today learn
        setSelectedLearn(
          schemeArr.filter((item) => item.learnDate === selectedDay),
        );
      } catch (err) {
        console.log("7777", (err as Error).message);
        // tip user data except
      }

      let nextLearn = findLearnFirstFutureItem(schemeArr);
      setNextLearn(nextLearn);
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

      let reviewFirstFutureDate = findReviewFirstFutureItem(reviewArr);

      let reviewFirstFutureDateArr: ReviewItem[] = [];
      // console.log(reviewArr, reviewFirstFutureDate);
      // reviewFirstFutureDate == null, reviewFirstFutureDate is undefined or null
      if (reviewFirstFutureDate != null) {
        reviewFirstFutureDateArr = reviewArr.filter(
          (item) => item.reviewDate === reviewFirstFutureDate?.reviewDate,
        );
        // no learnDate ,also has reviewDate, if reviewDate is not exist, scheme is already end。
        setNextFirstFutureDate(reviewFirstFutureDate["reviewDate"]);
      }
      setNextReview(reviewFirstFutureDateArr);
      // console.log("1221", reviewFirstFutureDateArr);

      // setTimeout(() => {
      //   // console.log("xxxxxxx", selectedLearn, selectedReview);
      //   console.log("222", reviewArr);
      //   getOneDataByKey(reviewSchemeDbRef.current, "9").then((value) =>
      //     console.log(value),
      //   );
      // }, 2000);

      // task all complete，last day ，and later
    };

    pageInit();
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
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        {location.pathname === "/daytask" ? (
          <span style={{ color: "#1e293b", fontWeight: 600 }}>学习日程</span>
        ) : (
          <Link to="/daytask">学习日程</Link>
        )}

        <Link to="/setting">关于设置</Link>
      </Space>
      <Space
        orientation="horizontal"
        size="large"
        style={{
          display: "flex",
          marginBottom: 10,
          justifyContent: "space-between",
          fontSize: 14,
          color: "#334155",
        }}
      >
        <span>
          学习内容：
          {mySchemeBriefRef.current?.book}
        </span>
        <span>
          开始日期：
          {mySchemeBriefRef.current?.startDay}
        </span>
      </Space>
      <Space
        orientation="horizontal"
        size="small"
        style={{
          display: "flex",
          marginBottom: 20,
          justifyContent: "space-between",
          fontSize: 14,
          color: "#334155",
        }}
      >
        <span>
          每天学习：
          {mySchemeBriefRef.current?.wordsGroup}个
        </span>
        <span>
          预计天数：
          {mySchemeBriefRef.current?.groupNums &&
            mySchemeBriefRef.current?.groupNums + 21}
          天
        </span>
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

      <Space
        orientation="horizontal"
        size="large"
        style={{
          display: "flex",
          marginTop: 20,
          fontSize: 14,
          color: "#f97316",
        }}
      >
        {nextFirstFutureDate && (
          <>
            <span>下次学习日期：{nextFirstFutureDate}</span>
            {nextLearn ? <span>有1个学习任务</span> : <span></span>}
            {nextReview.length > 0 ? (
              <span>有{nextReview.length}个复习任务</span>
            ) : (
              <span></span>
            )}
          </>
        )}
      </Space>
    </div>
  );
};

export default StudyDay;
