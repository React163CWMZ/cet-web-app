import { Link, useNavigate, useLocation } from "react-router-dom";
import EbbinghausCalendar from "../components/EbbinghausCalendar";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

const StudyCalendar = () => {
  const navigate = useNavigate();

  // 引入 useLocation 钩子接收参数
  const location = useLocation();
  //解构参数（加类型注解更规范）
  const { wordBook, dailyCount, totalDays, startDay } = location.state || {};
  const name: string = wordBook?.title;
  return (
    <>
      <ConfigProvider locale={zhCN}>
        {" "}
        {/* 这行代码让 Antd 组件变中文 */}
        <h3>当前学习计划</h3>
        <p>单词本：{wordBook?.title}</p>
        <p>每日学习：{dailyCount} 个</p>
        <p>预计天数：{totalDays} 天</p>
        <EbbinghausCalendar
          book={name}
          wordsGroup={dailyCount}
          groupNums={totalDays}
          startDay={startDay}
        />
      </ConfigProvider>
    </>
  );
};

export default StudyCalendar;
