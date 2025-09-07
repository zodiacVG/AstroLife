from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import json
from pathlib import Path
from datetime import datetime

# 加载环境变量
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

def _parse_cors_origins() -> list[str]:
    origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
    if origins_env:
        return [o.strip() for o in origins_env.split(",") if o.strip()]
    # 默认允许本机常用端口
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app = FastAPI(
    title="星航预言家 API",
    description="基于航天器神谕的智能占卜系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载航天器数据
def load_starships_data():
    data_path = Path("../shared/astro_data/starships.json")
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise Exception("航天器数据文件未找到")

starships_data = load_starships_data()

class CalculationRequest(BaseModel):
    birth_date: str  # YYYY-MM-DD格式
    question: Optional[str] = None

class DivineOriginRequest(BaseModel):
    birth_date: str

class DivineCelestialRequest(BaseModel):
    inquiry_date: Optional[str] = None  # 缺省为当前日期

class DivineInquiryRequest(BaseModel):
    question: str

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

# ---- History models ----
class HistoryItem(BaseModel):
    id: str
    device_id: str
    time: int
    birth_date: str
    question: Optional[str] = None
    origin: Optional[Dict[str, Any]] = None
    celestial: Optional[Dict[str, Any]] = None
    inquiry: Optional[Dict[str, Any]] = None
    interpretation: Optional[str] = None

def _history_path() -> Path:
    backend_dir = Path(__file__).parent.parent
    data_dir = backend_dir / 'data'
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / 'history.json'

def _read_history() -> List[Dict[str, Any]]:
    path = _history_path()
    if not path.exists():
        return []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def _write_history(items: List[Dict[str, Any]]):
    path = _history_path()
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

@app.get("/")
async def root():
    return {
        "message": "星航预言家 API 服务正常运行",
        "version": "1.0.0",
        "starships_count": len(starships_data.get('starships', []))
    }

# --- v1 规范化 API ---
@app.get("/api/v1")
async def api_v1_root():
    return {
        "success": True,
        "message": "AstroLife API v1",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }

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
        # 直接导入算法模块
        from .oracle_algorithm import calculate_oracle
        
        # 调用核心算法（异步）
        result = await calculate_oracle(request.birth_date, request.question)
        
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
    return await calculate_oracle(request)

# ---- Divine endpoints (v1) ----
@app.post("/api/v1/divine/origin")
async def divine_origin(payload: DivineOriginRequest):
    try:
        print('[API] /divine/origin payload:', payload.model_dump())
        from .oracle_algorithm import parse_date, calculate_origin_starship
        birth_date = parse_date(payload.birth_date)
        starship, score = calculate_origin_starship(birth_date, starships_data.get("starships", []))
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
        raise HTTPException(status_code=500, detail={"code": "CALCULATION_ERROR", "message": str(e)})


@app.post("/api/v1/divine/celestial")
async def divine_celestial(payload: DivineCelestialRequest):
    try:
        print('[API] /divine/celestial payload:', payload.model_dump())
        from .oracle_algorithm import parse_date, calculate_celestial_starship
        current_date = parse_date(payload.inquiry_date) if payload.inquiry_date else datetime.now()
        starship, score = calculate_celestial_starship(current_date, starships_data.get("starships", []))
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
        raise HTTPException(status_code=500, detail={"code": "CALCULATION_ERROR", "message": str(e)})


@app.post("/api/v1/divine/inquiry")
async def divine_inquiry(payload: DivineInquiryRequest):
    try:
        print('[API] /divine/inquiry payload:', payload.model_dump())
        from .oracle_algorithm import calculate_inquiry_starship
        starship, score = await calculate_inquiry_starship(payload.question, starships_data.get("starships", []))
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
        raise HTTPException(status_code=500, detail={"code": "CALCULATION_ERROR", "message": str(e)})


@app.post("/api/v1/divine/complete")
async def divine_complete(payload: CalculationRequest):
    print('[API] /divine/complete payload:', payload.model_dump())
    return await calculate_oracle(payload)


# Streaming interpretation (chunked text)
@app.post("/api/v1/divine/stream")
async def divine_stream(payload: CalculationRequest):
    """真实流式：先计算三舟，再交给 LLM 流式生成（若可用），否则快速分块回退。"""
    try:
        from .oracle_algorithm import (
            load_starships_data, parse_date, calculate_origin_starship, calculate_celestial_starship, calculate_inquiry_starship
        )
        from .llm_service import get_llm_service

        # 计算三舟
        data = load_starships_data()
        starships = data.get("starships", [])
        birth = parse_date(payload.birth_date)
        origin, _ = calculate_origin_starship(birth, starships)
        from datetime import datetime
        celestial, _ = calculate_celestial_starship(datetime.now(), starships)
        inquiry, _ = await calculate_inquiry_starship(payload.question or "", starships)

        try:
            llm = get_llm_service()
            gen = llm.stream_final_interpretation(origin, celestial, inquiry, payload.question)
            return StreamingResponse(gen, media_type="text/plain; charset=utf-8")
        except Exception as e:
            # 回退：一次性生成并快速分块
            from .oracle_algorithm import generate_interpretation
            text = await generate_interpretation(origin, celestial, inquiry, payload.question)
            def fast_chunks():
                step = 256
                for i in range(0, len(text), step):
                    yield text[i:i+step]
            return StreamingResponse(fast_chunks(), media_type="text/plain; charset=utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STREAM_ERROR: {e}")

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

# ---- History endpoints ----
@app.get("/api/v1/history")
async def get_history(device_id: str):
    items = _read_history()
    filtered = [x for x in items if x.get('device_id') == device_id]
    return {"success": True, "data": filtered, "message": "OK", "timestamp": datetime.now().isoformat()}

@app.post("/api/v1/history")
async def add_history(item: HistoryItem):
    items = _read_history()
    items.append(item.model_dump())
    _write_history(items)
    return {"success": True, "data": item.model_dump(), "message": "SAVED", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 8000)))
