# 后端（FastAPI）

基于 FastAPI 的 API 服务，提供航天器数据与占卜计算能力。

## 快速开始

1) 创建并配置环境变量

```bash
cp backend/.env.example backend/.env
# 按需填写 API Key 等配置
```

2) 安装依赖（推荐在 Python 3.11 虚拟环境中）

```bash
cd backend
python3.11 -m venv venv   # 确保使用 Python 3.11/3.12
source venv/bin/activate  # Windows 使用 venv\Scripts\activate
pip install -r requirements.txt
```

3) 启动开发服务

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

开启后访问：
- 健康检查: http://localhost:8000/health
- OpenAPI 文档: http://localhost:8000/docs

## 环境变量

在 `backend/.env` 配置：

- `ALIYUN_BAILIAN_API_KEY`：阿里云百炼 API Key（启用 LLM 功能时必须）
- `ALIYUN_BAILIAN_MODEL`：模型名称，默认 `qwen-plus`
- `CORS_ALLOW_ORIGINS`：逗号分隔的允许跨域来源列表（如 `http://localhost:5173,https://your.app`）
- `HOST`：服务绑定主机，默认 `0.0.0.0`
- `PORT`：服务端口，默认 `8000`

示例见：`backend/.env.example`

### 关于 Python 版本

- 推荐使用 Python 3.11/3.12。
- 若使用 3.13，`pydantic-core` 可能需要本地 Rust 工具链编译，需先安装 Rust（如 `brew install rust` 或 `rustup`）。

## 主要端点（规范 v1）

- `GET /api/v1`：API 入口
- `GET /api/v1/starships`：航天器全集（包裹响应）
- `GET /api/v1/starships/{archive_id}`：按 ID 获取航天器（包裹响应）
- `POST /api/v1/calculate`：占卜计算（包裹响应）
- `POST /api/v1/divine/origin`：本命星舟（基于出生日期）
- `POST /api/v1/divine/celestial`：天时星舟（基于提问日期，缺省当前）
- `POST /api/v1/divine/inquiry`：问道星舟（仅 LLM，失败返回空）
- `POST /api/v1/divine/complete`：完整三体计算（等同 calculate）
- `GET /api/v1/health`：健康检查（包裹响应）

兼容端点（历史保留）：`/starships`、`/starships/{id}`、`/calculate`、`/health`

## 统一命名

- 本命：origin
- 天时：celestial
- 问道：inquiry（仅 LLM，不支持关键词回退）

## 共享数据路径

服务使用 `shared/astro_data/starships.json` 作为数据源，已在代码中通过项目根路径解析，无需额外配置。
