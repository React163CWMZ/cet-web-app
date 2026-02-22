import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { browserRouter } from "./router";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
// React 引入样式示例
import "antd/dist/antd.css";
// import App from "./App.tsx";
// 如果你删除了 <App />：那你必须确保所有的 UI（比如导航栏、页脚）都写在路由配置文件或者各个页面组件里了。
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 直接渲染路由，不经过 App 组件 */}
    <RouterProvider router={browserRouter} />
  </StrictMode>,
);
