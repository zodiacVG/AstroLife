from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv
import json
from pathlib import Path
from datetime import datetime
import logging
import time
import traceback
from types import ModuleType

# 加载环境变量
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

def _cors_config() -> dict:
    """构建 CORS 中间件配置。

    优先使用显式的 `CORS_ALLOW_ORIGINS`（逗号分隔）。
    如果未配置，则使用正则放行本机与私有网段（10/172.16-31/192.168）。
    可通过 `CORS_ALLOW_ORIGIN_REGEX` 自定义覆盖默认正则。
    """
    origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
    origin_regex_env = os.getenv("CORS_ALLOW_ORIGIN_REGEX", "")
    
    # 检查是否为开发环境
    is_dev = os.getenv("ENVIRONMENT", "").lower() in ("dev", "development", "")

    cfg: dict[str, Any] = {}
    allow_origins: list[str] = []
    
    if origins_env:
        raw = [o.strip() for o in origins_env.split(",") if o.strip()]
        # 规范化：去除尾部斜杠，避免与浏览器 Origin 严格匹配失败
        allow_origins = [o[:-1] if o.endswith('/') else o for o in raw]
        # 提示潜在配置问题
        try:
            stripped = [o for o in raw if o.endswith('/')]
            if stripped:
                print("[CORS] normalized origins (removed trailing '/'):", stripped)
        except Exception:
            pass
    elif is_dev:
        # 开发环境：允许所有localhost端口
        cfg["allow_origins"] = ["*"]
    else:
        # 生产环境：默认允许的本机端口
        allow_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    if allow_origins:
        cfg["allow_origins"] = allow_origins

    # 当未显式指定 origins 且未设置开发环境通配符时，同时允许常见私网段与 localhost 的正则
    if origin_regex_env:
        cfg["allow_origin_regex"] = origin_regex_env
    elif "allow_origins" not in cfg and not origins_env and not is_dev:
        # 允许：localhost/127.0.0.1 以及 10.x.x.x、172.16-31.x.x、192.168.x.x 任意端口
        cfg["allow_origin_regex"] = r"^http://(localhost|127\\.0\\.0\\.1|10\\.[0-9.]+|172\\.(1[6-9]|2[0-9]|3[0-1])\\.[0-9.]+|192\\.168\\.[0-9.]+):\\d+$"

    return cfg

app = FastAPI(
    title="星航预言家 API",
    description="基于航天器神谕的智能占卜系统",
    version="1.0.0"
)

# ---- Logging setup ----
def _setup_logging():
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=getattr(logging, level, logging.INFO))
    # Reuse uvicorn access logger handlers if available
    try:
        uvicorn_access = logging.getLogger("uvicorn.access")
        root = logging.getLogger()
        for h in uvicorn_access.handlers:
            if h not in root.handlers:
                root.addHandler(h)
    except Exception:
        pass
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)

_setup_logging()
log = logging.getLogger("app")

# --- import compatibility helpers (works for both `uvicorn app.main:app` and `uvicorn main:app`) ---
def _import_oracle_module() -> ModuleType:
    try:
        import app.oracle_algorithm as m  # type: ignore
        return m
    except ModuleNotFoundError:
        import oracle_algorithm as m  # type: ignore
        return m

def _import_llm_module() -> ModuleType:
    try:
        import app.llm_service as m  # type: ignore
        return m
    except ModuleNotFoundError:
        import llm_service as m  # type: ignore
        return m

# Simple HTTP middleware for request tracing
@app.middleware("http")
async def _req_logger(request: Request, call_next):
    start = time.perf_counter()
    rid = request.headers.get("x-request-id") or os.urandom(4).hex()
    try:
        origin = request.headers.get("origin")
        ua = request.headers.get("user-agent", "-")
        log.info("[req] id=%s %s %s origin=%s ua=%s", rid, request.method, request.url.path, origin, ua)
        if request.method == 'OPTIONS':
            acrm = request.headers.get('access-control-request-method')
            acrh = request.headers.get('access-control-request-headers')
            log.info("[preflight] id=%s ACRM=%s ACRH=%s", rid, acrm, acrh)
        response = await call_next(request)
        dur_ms = int((time.perf_counter() - start) * 1000)
        log.info(f"[res] id=%s %s %s status=%s dur=%sms", rid, request.method, request.url.path, getattr(response, 'status_code', '-'), dur_ms)
        return response
    except Exception as e:
        dur_ms = int((time.perf_counter() - start) * 1000)
        log.error(f"[err] id=%s %s %s dur=%sms exc=%s\n%s", rid, request.method, request.url.path, dur_ms, e, traceback.format_exc())
        raise

# Global exception logging (keeps default behavior while ensuring stacktrace is logged)
@app.exception_handler(Exception)
async def _unhandled_exc_handler(request: Request, exc: Exception):
    log.error("[panic] %s %s %s\n%s", request.method, request.url.path, exc, traceback.format_exc())
    # Preserve existing FastAPI default for unhandled exceptions
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=500, content={
        "success": False,
        "code": "INTERNAL_SERVER_ERROR",
        "message": str(exc),
    })

# CORS配置
_cfg = _cors_config()

# 打印 CORS 相关环境变量与最终生效配置，便于线上排查
try:
    print("[CORS] ENVIRONMENT:", os.getenv("ENVIRONMENT"))
    print("[CORS] CORS_ALLOW_ORIGINS:", os.getenv("CORS_ALLOW_ORIGINS"))
    print("[CORS] CORS_ALLOW_ORIGIN_REGEX:", os.getenv("CORS_ALLOW_ORIGIN_REGEX"))
    _eff = {
        "allow_origins": _cfg.get("allow_origins"),
        "allow_origin_regex": _cfg.get("allow_origin_regex"),
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    print("[CORS] effective:", _eff)
except Exception as _e:
    print("[CORS] print failed:", _e)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    **_cfg,
)

# ---- Static media (for audio/video) ----
# Mount data directory at /media to serve audio with HTTP range support.
# Handle both local layout (backend/app -> backend/data) and container layout (/app -> /app/data).
try:
    candidates = [
        Path(__file__).resolve().parent.parent / "data",  # local: backend/data
        Path(__file__).resolve().parent / "data",         # container: /app/data
        Path.cwd() / "data",                               # fallback: CWD/data
    ]
    media_dir = next((p for p in candidates if p.exists()), None)
    if media_dir:
        print(f"[media] mounting static directory: {media_dir}")
        app.mount("/media", StaticFiles(directory=str(media_dir), html=False), name="media")
    else:
        print("[media] no data directory found; /media will not be available")
except Exception as _e:
    # Non-fatal; app continues without media mount
    print("[media] mount failed:", _e)

def _resolve_starships_path() -> Path:
    """解析 starships.json 的实际路径。

    解析顺序（存在即返回）：
    1) 显式环境变量 `STARSHIPS_JSON`
    2) 与后端根（backend）同级的 `data/starships.json`
    3) 仓库根的 `data/starships.json`（当容器外本地运行且能访问到上一层目录时）
    4) 当前工作目录下的 `data/starships.json`（兜底）
    """
    # 1) 显式环境变量
    env_path = os.getenv("STARSHIPS_JSON")
    if env_path:
        p = Path(env_path)
        if p.exists():
            return p

    # 基于文件位置定位 backend 根目录
    backend_root = Path(__file__).resolve().parent.parent  # backend/

    # 2) backend/data/starships.json（容器内常见路径）
    candidate = backend_root / "data" / "starships.json"
    if candidate.exists():
        return candidate

    # 3) 仓库根 data/starships.json（本地运行、Zeabur 非 Docker 情况）
    repo_root_candidate = backend_root.parent / "data" / "starships.json"
    if repo_root_candidate.exists():
        return repo_root_candidate

    # 4) 工作目录相对路径兜底
    cwd_candidate = Path("data/starships.json").resolve()
    if cwd_candidate.exists():
        return cwd_candidate

    # 均未找到
    raise FileNotFoundError(
        "未能定位到 starships.json。请确保以下任一路径存在:\n"
        f"- 后端目录: {backend_root / 'data' / 'starships.json'}\n"
        f"- 仓库根目录: {backend_root.parent / 'data' / 'starships.json'}\n"
        f"- 或设置环境变量 STARSHIPS_JSON 指向有效文件路径"
    )


# 加载航天器数据
def load_starships_data():
    data_path = _resolve_starships_path()
    try:
        print(f"[startup] loading starships from: {data_path}")
    except Exception:
        pass
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)


starships_data = load_starships_data()

class CalculationRequest(BaseModel):
    birth_date: str  # YYYY-MM-DD格式
    name: Optional[str] = None
    question: Optional[str] = None

class DivineOriginRequest(BaseModel):
    birth_date: str
    name: Optional[str] = None

class DivineCelestialRequest(BaseModel):
    inquiry_date: Optional[str] = None  # 缺省为当前日期

class DivineInquiryRequest(BaseModel):
    question: str
    name: Optional[str] = None

class AstroSpacecraft(BaseModel):
    archive_id: str
    name_cn: str
    name_official: str
    launch_date: str
    operator: str
    mission_description: str
    status: str
    oracle_keywords: List[str]
    oracle_text: str

class CalculationResult(BaseModel):
    birth_date: str
    question: Optional[str] = None
    # 标准化结构：三体结果聚合
    starships: Optional[dict] = None
    interpretation: Optional[str] = None

## 历史记录改为前端 localStorage 存储
## 后端不再持久化历史，接口已移除（前端直接使用浏览器存储）

@app.get("/")
async def root():
    return {
        "message": "星航预言家 API 服务正常运行",
        "version": "1.0.0",
        "starships_count": len(starships_data.get('starships', []))
    }


@app.get("/health")
async def health():
    return {"status": "ok"}

# --- v1 规范化 API ---
@app.get("/api/v1")
async def api_v1_root():
    return {
        "success": True,
        "message": "AstroLife API v1",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/v1/health")
async def api_v1_health():
    return {"success": True, "status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/starships")
async def get_starships():
    """获取所有航天器数据"""
    return starships_data

@app.get("/api/v1/starships")
async def get_starships_v1():
    return {
        "success": True,
        "data": starships_data,
        "message": "OK",
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/starships/{archive_id}")
async def get_starship(archive_id: str):
    """根据ID获取特定航天器"""
    starship = next((s for s in starships_data['starships'] if s['archive_id'] == archive_id), None)
    if not starship:
        raise HTTPException(status_code=404, detail="航天器未找到")
    return starship

@app.get("/api/v1/starships/{archive_id}")
async def get_starship_v1(archive_id: str):
    starship = next((s for s in starships_data['starships'] if s['archive_id'] == archive_id), None)
    if not starship:
        raise HTTPException(status_code=404, detail="航天器未找到")
    return {
        "success": True,
        "data": starship,
        "message": "OK",
        "timestamp": datetime.now().isoformat(),
    }

@app.post("/calculate")
async def calculate_oracle(request: CalculationRequest):
    """计算神谕API端点（异步版本）"""
    try:
        # 兼容导入算法模块并调用（异步）
        _oracle = _import_oracle_module()
        result = await _oracle.calculate_oracle(request.birth_date, request.question)
        
        return {
            "success": True,
            "data": result,
            "message": "神谕计算成功",
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算错误: {str(e)}")

@app.post("/api/v1/calculate")
async def calculate_oracle_v1(request: CalculationRequest):
    # 纠正参数传递：oracle_algorithm.calculate_oracle(birth_date_str, question)
    try:
        _oracle = _import_oracle_module()
        result = await _oracle.calculate_oracle(request.birth_date, request.question)
        return {"success": True, "data": result, "message": "OK", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        log.error("[calculate] failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail={"code": "CALCULATION_ERROR", "message": str(e)})

# ---- Divine endpoints (v1) ----
@app.post("/api/v1/divine/origin")
async def divine_origin(payload: DivineOriginRequest):
    try:
        print('[API] /divine/origin payload:', payload.model_dump())
        _oracle = _import_oracle_module()
        birth_date = _oracle.parse_date(payload.birth_date)
        starship, score = _oracle.calculate_origin_starship(birth_date, starships_data.get("starships", []))
        log.info("[divine.origin] birth=%s result=%s score=%.3f", payload.birth_date, starship and starship.get('archive_id'), score)
        return {
            "success": True,
            "data": {
                "type": "origin",
                "starship": starship,
                "match_score": round(score, 3),
                "basis": "birth_date vs launch_date"
            },
            "message": "OK",
            "timestamp": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"code": "INVALID_DATE_FORMAT", "message": str(e)})
    except Exception as e:
        log.error("[divine.origin] failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail={"code": "CALCULATION_ERROR", "message": str(e)})


@app.post("/api/v1/divine/celestial")
async def divine_celestial(payload: DivineCelestialRequest):
    try:
        print('[API] /divine/celestial payload:', payload.model_dump())
        _oracle = _import_oracle_module()
        current_date = _oracle.parse_date(payload.inquiry_date) if payload.inquiry_date else datetime.now()
        starship, score = _oracle.calculate_celestial_starship(current_date, starships_data.get("starships", []))
        log.info("[divine.celestial] date=%s result=%s score=%.3f", payload.inquiry_date or 'now', starship and starship.get('archive_id'), score)
        return {
            "success": True,
            "data": {
                "type": "celestial",
                "starship": starship,
                "match_score": round(score, 3),
                "basis": "inquiry_date vs launch_date"
            },
            "message": "OK",
            "timestamp": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"code": "INVALID_DATE_FORMAT", "message": str(e)})
    except Exception as e:
        log.error("[divine.celestial] failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail={"code": "CALCULATION_ERROR", "message": str(e)})


@app.post("/api/v1/divine/inquiry")
async def divine_inquiry(payload: DivineInquiryRequest):
    try:
        print('[API] /divine/inquiry payload:', payload.model_dump())
        _oracle = _import_oracle_module()
        starship, score = await _oracle.calculate_inquiry_starship(payload.question, starships_data.get("starships", []))
        log.info("[divine.inquiry] q.len=%s result=%s score=%.3f", len(payload.question or ''), starship and starship.get('archive_id'), score)
        return {
            "success": True,
            "data": {
                "type": "inquiry",
                "starship": starship,
                "match_score": round(score, 3),
                "basis": "LLM only"
            },
            "message": "OK",
            "timestamp": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"code": "MISSING_REQUIRED_FIELD", "message": str(e)})
    except Exception as e:
        log.error("[divine.inquiry] failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail={"code": "CALCULATION_ERROR", "message": str(e)})


# 已弃用：最终解读走 oracle/stream（SSE），不再使用 complete 端点


# Streaming interpretation (SSE): 仅 GET（适配原生 EventSource）


@app.get("/api/v1/oracle/stream")
async def oracle_stream(origin_id: str, celestial_id: str, inquiry_id: str, question: str = "", name: str = ""):
    """使用前端已计算出的三艘飞船与问题，流式生成最终解读（SSE）。"""
    try:
        _oracle = _import_oracle_module()
        _llm = _import_llm_module()

        print('[SSE] /api/v1/oracle/stream params:', {
            'origin_id': origin_id, 'celestial_id': celestial_id, 'inquiry_id': inquiry_id, 'question': question, 'name': name
        })
        data = _oracle.load_starships_data()
        starships = data.get("starships", [])

        def _by_id(sid: str):
            return next((s for s in starships if s.get("archive_id") == sid), None)

        origin = _by_id(origin_id)
        celestial = _by_id(celestial_id)
        inquiry = _by_id(inquiry_id)
        print('[SSE] resolved starships:', {
            'origin': origin and {'id': origin.get('archive_id'), 'name': origin.get('name_cn')},
            'celestial': celestial and {'id': celestial.get('archive_id'), 'name': celestial.get('name_cn')},
            'inquiry': inquiry and {'id': inquiry.get('archive_id'), 'name': inquiry.get('name_cn')},
        })
        if not origin or not celestial or not inquiry:
            raise ValueError("缺少必要的飞船: origin/celestial/inquiry")

        def _sse(event: str, obj: dict):
            import json as _json
            return f"event: {event}\ndata: {_json.dumps(obj, ensure_ascii=False)}\n\n"

        def _stream():
            try:
                llm = _llm.get_llm_service()
                # 打印发送给模型的提示词（仅用于调试）
                try:
                    prompt = llm._build_final_interpretation_prompt(origin, celestial, inquiry, question, name)  # type: ignore[attr-defined]
                    print('[SSE] prompt to LLM (first 800):\n' + (prompt[:800] + ('...' if len(prompt) > 800 else '')))
                except Exception as _e:
                    print('[SSE] prompt build log failed:', _e)
                for delta in llm.stream_final_interpretation(origin, celestial, inquiry, question, name):
                    if delta:
                        yield _sse("result", {"output_text": delta})
                yield _sse("completed", {"ok": True})
            except Exception as e:
                yield _sse("error", {"message": str(e)})

        return StreamingResponse(_stream(), media_type="text/event-stream; charset=utf-8", headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        })
    except Exception as e:
        def _err(error_obj):
            import json as _json
            yield f"event: error\ndata: {_json.dumps({'message': f'STREAM_ERROR: {error_obj}'}, ensure_ascii=False)}\n\n"
        return StreamingResponse(_err(e), media_type="text/event-stream; charset=utf-8", headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        })

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "model": os.getenv("ALIYUN_BAILIAN_MODEL"),
        "api_key_configured": bool(os.getenv("ALIYUN_BAILIAN_API_KEY"))
    }

@app.get("/api/v1/health")
async def health_check_v1():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "model": os.getenv("ALIYUN_BAILIAN_MODEL"),
            "api_key_configured": bool(os.getenv("ALIYUN_BAILIAN_API_KEY"))
        },
        "message": "OK",
        "timestamp": datetime.now().isoformat(),
    }

## 历史接口已删除

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 8000)))
