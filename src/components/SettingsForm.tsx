import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Radio,
  Button,
  Card,
  ConfigProvider,
  Modal,
  Divider,
  // message,
  // Space,a
  // Switch,
  // theme,
} from "antd";
import type { RadioChangeEvent } from "antd/lib/radio";
import useLocalforageDb, {
  getOneDataByKey,
  setOneDataByKey,
} from "../utils/useLocalforageDb";

const SettingsForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  // const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundValue, setSoundValue] = useState("on");

  // 新增：用ref存储数据库实例，避免重复初始化
  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };
  // 处理重置学习计划
  const handleOk = () => {
    setIsModalOpen(false);
    navigate("/book");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onChange = (e: RadioChangeEvent) => {
    setOneDataByKey(configDbRef.current, "sound-config", e.target.value);
    setSoundValue(e.target.value);
  };

  useEffect(() => {
    getOneDataByKey(configDbRef.current, "sound-config").then((value) => {
      if (typeof value === "string") {
        setSoundValue(value);
      } else {
        // empty default is sound on
        setSoundValue("off");
      }
    });
  }, []);

  return (
    // 使用 ConfigProvider 包裹，动态修改主题 token
    <ConfigProvider
      theme={
        {
          // algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }
      }
    >
      <Modal
        title="重置学习计划"
        okText="确定"
        cancelText="取消"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Divider />
        <p>重置学习计划，之前的学习计划会删除。</p>
        <p>步骤：先选择单词表，将开启新的学习计划。</p>
      </Modal>
      <Card
        title="用户设置"
        style={{
          maxWidth: "100%",
          margin: "50px auto",
          backgroundColor: "var(--ant-color-bg-container)",
        }}
        styles={{
          header: {
            background: "#4096FF", // 顶部蓝色
            color: "#fafafa",
            fontSize: "16px",
            fontWeight: 500,
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            sound: "on", // 默认开启声音
          }}
        >
          {/* 1. 声音设置 */}

          <Form.Item label="声音设置">
            <Radio.Group onChange={onChange} value={soundValue}>
              <Radio value="on">开启</Radio>
              <Radio value="off">关闭</Radio>
            </Radio.Group>
          </Form.Item>
          {/* <Form.Item label="主题切换" name="themeChange">
            <Switch
              checkedChildren="暗色"
              unCheckedChildren="亮色"
              checked={isDarkMode}
              onChange={(checked) => setIsDarkMode(checked)}
            />
          </Form.Item> */}
          <Form.Item label="重置" name="change">
            <Button type="link" onClick={showModal}>
              新学习计划
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </ConfigProvider>
  );
};

export default SettingsForm;
