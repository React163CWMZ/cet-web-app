import React from "react";
import { Card, List } from "antd";
// import type { StudyItem } from "./types"; // 如果抽离了类型，就导入

// 类型定义
interface StudyItem {
  id: string;
  title: string;
  learnDate: string; // 格式：YYYY-MM-DD
}

interface StudyTaskCardProps {
  selectedDay: string;
  learnTasks: StudyItem[];
  reviewTasks: StudyItem[];
}

// 专注于渲染任务列表的子组件
const StudyTaskCard: React.FC<StudyTaskCardProps> = ({
  selectedDay,
  learnTasks,
  reviewTasks,
}) => {
  return (
    <Card title={`📌 ${selectedDay} 任务`}>
      <h4>📖 新学</h4>
      <List
        dataSource={learnTasks}
        renderItem={(item) => <List.Item>{item.title}</List.Item>}
        bordered
        locale={{ emptyText: "今日暂无新学任务" }}
      />

      <h4 style={{ marginTop: 16 }}>🔁 复习</h4>
      <List
        dataSource={reviewTasks}
        renderItem={(item) => <List.Item>{item.title}</List.Item>}
        bordered
        locale={{ emptyText: "今日暂无复习任务" }}
      />
    </Card>
  );
};

export default StudyTaskCard;
