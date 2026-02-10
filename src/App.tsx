import { Card, Space, Button, Flex } from "antd"; // 1. 导入 Card 组件
import localforage from "localforage";
import wordList from "./assets/data_json.ts";
const App: React.FC = () => {
  const nextOne = () => {
    console.log("cliked");
  };
  const wordDB = localforage.createInstance({
    name: "MyApp", //数据库名
    storeName: "wordStore", // 类似于表名
  });
  async function importJsonData() {
    try {
      console.log("import data");

      const entries = Object.entries(wordList);
      await Promise.all(
        entries.map(([key, value]) => {
          return wordDB.setItem(value["word"], value);
        }),
      );
      console.log("导入成功！");
    } catch (err) {
      console.error("导入失败:", err);
    }
  }

  async function getData() {
    try {
      const data = await wordDB.getItem("apple");
      if (data) {
        alert("读取到数据：\n" + JSON.stringify(data, null, 2));
      } else {
        alert("未读取到数据（可能未保存或已删除）");
      }
    } catch (err) {
      alert("读取失败：" + err);
    }
  }
  const importData = () => {
    importJsonData();
  };
  const getWord = () => {
    getData();
  };
  return (
    <>
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

      <Button onClick={importData}>导入数据</Button>
      <Button onClick={getWord}>得到数据</Button>
    </>
  );
};

export default App;
