import { Link, useNavigate, useLocation } from "react-router-dom";
import EbbinghausCalendar from "../components/EbbinghausCalendar";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

const StudyCalendar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ConfigProvider locale={zhCN}>
      {" "}
      {/* 这行代码让 Antd 组件变中文 */}
      <EbbinghausCalendar />
    </ConfigProvider>
  );
};

export default StudyCalendar;
