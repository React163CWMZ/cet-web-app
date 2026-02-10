import { Card, Space, Button, Flex } from "antd"; // 1. 导入 Card 组件
import localforage from "localforage";
const App: React.FC = () => {
  const nextOne = () => {
    console.log("cliked");
  };
  return (
    <Space vertical size={16}>
      <Card
        style={{
          width: 300,
          borderColor: "#4096FF",
          backgroundColor: "#E6F4FF",
        }}
      >
        <p>Card content</p>
        <p>Card content</p>
        <p>Card content</p>
      </Card>

      <Flex gap="small" wrap>
        <Button type="primary">显示意思</Button>
        <Button onClick={nextOne} type="primary">
          下一个
        </Button>
      </Flex>
    </Space>
  );
};

export default App;
