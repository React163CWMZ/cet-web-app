import { Space } from "antd";
import { Link, useLocation } from "react-router-dom";

const Setting = () => {
  // const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: 20 }}>
      <Space
        orientation="horizontal"
        size="large"
        style={{
          display: "flex",
          marginBottom: 20,
          justifyContent: "space-between",
        }}
      >
        {location.pathname === "/daytask" ? (
          <span>学习日程</span>
        ) : (
          <Link to="/daytask">学习日程</Link>
        )}
        {location.pathname === "/setting" ? (
          <span>关于设置</span>
        ) : (
          <Link to="/setting">关于设置</Link>
        )}
      </Space>

      <p>致力于解决单词复习时间点的问题，给您制定完美的学习计划</p>
    </div>
  );
};

export default Setting;
