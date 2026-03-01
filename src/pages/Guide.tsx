import { Space } from "antd";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useLocalforageDb, {
  getOneDataByKey,
  getOneData,
} from "../utils/useLocalforageDb";

interface projConfig {
  hasInit: boolean;
}
interface SchemeBrief {
  key?: string;
  book?: string;
  wordsGroup: number;
  groupNums: number;
  startDay?: string;
}

const Guide = () => {
  const navigate = useNavigate();
  const configDbRef = useRef(useLocalforageDb("MyDb", "configStore"));
  const schemeBriefDbRef = useRef(useLocalforageDb("MyDb", "schemeBrief"));
  useEffect(() => {
    async function checkInit() {
      let hasInit: boolean = false;
      let hasScheme: boolean = false;
      // check if has schemeBrief data in db, if not, navigate to book select page, else navigate to daytask page.
      hasScheme = await getOneData(schemeBriefDbRef.current).then((scheme) => {
        if (scheme) {
          return true;
        } else {
          return false;
        }
      });
      // check if has init data in db, if not, navigate to book select page to init db, else navigate to daytask page.
      hasInit = await getOneDataByKey(
        configDbRef.current,
        "junior-config",
      ).then((config) => {
        // console.log("config", config);
        if (config && typeof config === "object" && "hasInit" in config) {
          // return (config as projConfig)["hasInit"] as boolean;
          return config["hasInit"] as boolean;
        } else {
          return false;
        }
      });

      return;

      if (hasInit === false || hasScheme === false) {
        navigate("/book");
      } else {
        navigate("/daytask");
      }
    }

    checkInit();
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
