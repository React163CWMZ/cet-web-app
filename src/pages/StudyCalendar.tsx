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
