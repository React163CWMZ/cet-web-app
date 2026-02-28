import { Space } from "antd";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useLocalforageDb, { getOneDataByKey } from "../utils/useLocalforageDb";

interface projConfig {
  hasInit: boolean;
}

const Guide = () => {
  const navigate = useNavigate();
  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));
  useEffect(() => {
    let hasInit: boolean = false;
    getOneDataByKey(configDbRef.current, "junior-config").then((config) => {
      console.log("config", config);
      if (config) {
        console.log("11111", config);
        hasInit = (config as projConfig)["hasInit"];
      }
      if (hasInit === false) {
        navigate("/book");
      } else {
        navigate("/daytask");
      }
    });
  }, []);

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: 20 }}>
      <Space
        orientation="horizontal"
        size="large"
        style={{
          display: "flex",

          justifyContent: "space-between",
        }}
      >
        loading...
      </Space>
    </div>
  );
};

export default Guide;
