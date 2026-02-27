import type { RouteObject } from "react-router-dom"; // ✅ 使用 import type
import { createHashRouter } from "react-router-dom"; // 普通值的导入保持不变
import App from "./App";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import StudyCalendar from "./pages/StudyCalendar";
import BookSelect from "./pages/BookSelect";
import StudyDay from "./pages/StudyDay";
import Setting from "./pages/Setting";

// 路由配置
export const router: RouteObject[] = [
  { path: "/list", element: <Home /> },
  { path: "/study", element: <App /> },
  { path: "/about", element: <About /> },
  { path: "/calendar", element: <StudyCalendar /> },
  { path: "/", element: <BookSelect /> },
  { path: "/daytask", element: <StudyDay /> },
  { path: "/setting", element: <Setting /> },

  {
    path: "*", // 404 兜底路由
    element: <NotFound />,
  },
];

// 创建浏览器路由
export const browserRouter = createHashRouter(router);
