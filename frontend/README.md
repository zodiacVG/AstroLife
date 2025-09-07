# 前端（React + Vite）

本模块的运行与环境说明已整合到统一文档：`docs/DEVELOPMENT.md`。

要点速览：
- 启动开发：在仓库根目录执行 `npm run dev`
- 配置后端地址：复制 `frontend/.env.example` 为 `.env`，设置 `VITE_API_URL`
- API 访问：通过 `src/lib/api.ts` 统一组装地址（默认回退本机 :8000）
