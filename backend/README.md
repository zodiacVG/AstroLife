# 后端（FastAPI）

基于 FastAPI 的 API 服务，提供航天器数据与占卜计算能力。

## 快速开始

### 本地开发

1) 创建并配置环境变量

```bash
cp backend/.env.example backend/.env
# 按需填写 API Key 等配置
```

2) 安装依赖（必须在 Python 3.11 虚拟环境中）

```bash
cd backend
python3.11 -m venv venv   # 确保使用 Python 3.11
source venv/bin/activate  # Windows 使用 venv\Scripts\activate
pip install -r requirements.txt
```

3) 启动开发服务

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Docker 部署

1) 构建镜像

```bash
cd backend
docker build -t astrolife-backend .
```

2) 运行容器

```bash
docker run -p 8000:8000 -e ALIYUN_BAILIAN_API_KEY=your_api_key astrolife-backend
```

开启后访问：
- 健康检查: http://localhost:8000/health
- OpenAPI 文档: http://localhost:8000/docs

## 环境变量

在 `backend/.env` 配置：

- `ALIYUN_BAILIAN_API_KEY`：阿里云百炼 API Key（启用 LLM 功能时必须）
- `ALIYUN_BAILIAN_MODEL`：模型名称，默认 `qwen-plus`
- `CORS_ALLOW_ORIGINS`：逗号分隔的允许跨域来源列表（如 `http://localhost:5173,https://your.app`）
- `CORS_ALLOW_ORIGIN_REGEX`：允许来源的正则表达式（可选）。若未设置 `CORS_ALLOW_ORIGINS`，后端默认放行本机与私网网段：`localhost/127.0.0.1`、`10.x.x.x`、`172.16-31.x.x`、`192.168.x.x` 任意端口。
- `HOST`：服务绑定主机，默认 `0.0.0.0`
- `PORT`：服务端口，默认 `8000`
- 不需要数据库配置：历史记录保存在用户浏览器的 localStorage 中，后端无持久化。

示例见：`backend/.env.example`

开发场景常见问题：如果前端在 `http://172.29.0.1:5173` 启动（Vite `host:true`），而后端只允许 `localhost:5173`，会触发 CORS 预检失败。解决：
- 将该来源加入 `CORS_ALLOW_ORIGINS`，或
- 配置 `CORS_ALLOW_ORIGIN_REGEX`，或
- 将 Vite 绑定到 `localhost`。

### 关于 Python 版本

- **必须使用 Python 3.11**。项目依赖的 pydantic-core 在 Python 3.13 上需要 Rust 工具链编译，可能导致部署失败。
- 避免使用 Python 3.13，除非你已准备好安装 Rust 工具链并处理可能的编译问题。

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

服务使用 `data/starships.json` 作为数据源，已在代码中通过项目根路径解析，无需额外配置。

### 数据文件

项目使用 `data/starships.json` 文件存储航天器数据。在本地开发环境中，数据文件位于后端目录的 `data/` 子目录中。在 Docker 容器中，数据文件会被复制到容器的 `/app/data/` 目录。

## 历史记录存储（History）

- 历史记录由前端保存至浏览器 localStorage。
- 后端不提供历史记录的读取/写入接口。
