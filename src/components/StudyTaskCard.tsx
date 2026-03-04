import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Typography, Space, Button } from "antd";
// import type { StudyItem } from "./types"; // 如果抽离了类型，就导入
import useLocalforageDb, {
  setOneDataByKey,
} from "../utils/useLocalforageDb.ts";
const { Text } = Typography;

// 类型定义
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
interface StudyTaskCardProps {
  isActive: boolean;
  selectedDay: string;
  learnTasks: StudyItem[];
  reviewTasks: ReviewItem[];
}

// 专注于渲染任务列表的子组件
const StudyTaskCard: React.FC<StudyTaskCardProps> = ({
  isActive,
  selectedDay,
  learnTasks,
  reviewTasks,
}) => {
  const navigate = useNavigate();
  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));

  // set cur group, cur_learn, cur_review
  const handleStartStudy = async (
    group: string,
    studyType: "learn" | "review",
    curKey: string,
  ) => {
    await setOneDataByKey(configDbRef.current, "cur_group", parseInt(group));

    await setOneDataByKey(configDbRef.current, "cur_study", {
      studyType: studyType,
      db_key: curKey,
    });

    navigate("/study");
  };

  return (
    <Card
      title={`${selectedDay} 任务`}
      style={{ width: "100%" }}
      styles={{
        header: {
          background: "#4096FF", // 顶部蓝色
          color: "#fafafa",
          fontSize: "16px",
          fontWeight: 500,
        },
      }}
    >
      <h4>📖 新学</h4>
      {learnTasks.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {learnTasks.map((item, index) => (
            <li
              key={index}
              style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}
            >
              <Space
                orientation="horizontal"
                size="large"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Space>
                  <Badge color="blue" />
                  {item.title}
                  {item.isFinish === true && (
                    <span style={{ color: "#334155" }}>已完成</span>
                  )}
                </Space>

                {isActive && (
                  <Button
                    type="link"
                    color="pink"
                    onClick={() =>
                      handleStartStudy(item.id, "learn", item.db_key)
                    }
                  >
                    开始学习
                  </Button>
                )}
              </Space>
            </li>
          ))}
        </ul>
      ) : (
        <Text type="secondary" style={{ fontStyle: "italic" }}>
          今日暂无新学任务
        </Text>
      )}

      <h4 style={{ marginTop: 16 }}>🔁 复习</h4>
      {reviewTasks.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {reviewTasks.map((item, index) => (
            <li
              key={index}
              style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}
            >
              <Space
                orientation="horizontal"
                size="large"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Space>
                  <Badge color="orange" />
                  {item.title}
                  {item.isFinish === true && (
                    <span style={{ color: "#334155" }}>已完成</span>
                  )}
                </Space>
                {isActive && (
                  <Button
                    type="link"
                    color="pink"
                    onClick={() =>
                      handleStartStudy(item.studyId, "review", item.db_key)
                    }
                  >
                    开始复习
                  </Button>
                )}
              </Space>
            </li>
          ))}
        </ul>
      ) : (
        <Text type="secondary" style={{ fontStyle: "italic" }}>
          今日暂无复习任务
        </Text>
      )}
    </Card>
  );
};

export default StudyTaskCard;
