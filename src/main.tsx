import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// React 引入样式示例
import "antd/dist/antd.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
