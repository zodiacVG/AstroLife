# 前端（React + Vite）

使用 Vite 搭建的 React + TypeScript 前端。

## 快速开始

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

构建与预览：
```bash
npm run build
npm run preview   # 本地生产预览
```

## 与后端联调

前端通过 `VITE_API_URL` 配置后端地址（见 `src/lib/api.ts`）。可复制 `.env.example` 为 `.env` 并设置：

```
VITE_API_URL=http://localhost:8000
```

默认回退地址为 `http://localhost:8000`（开发环境）。
