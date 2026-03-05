// ==============================================
// 发布版本清空本地数据，开发版本保留数据
// ==============================================
// 直接判断是否是 Electron 生产环境
// const isProduction = !import.meta.env.DEV;

// if (isProduction) {
//   console.log("生产模式，清空数据");
//   // 清空 localStorage
//   localStorage.clear();

//   // 清空 IndexedDB
//   window.indexedDB.databases().then((dbs) => {
//     dbs.forEach((db) => {
//       if (db.name) {
//         window.indexedDB.deleteDatabase(db.name);
//       }
//     });
//   });
// }

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { browserRouter } from "./router";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
// import "./App.css";
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
