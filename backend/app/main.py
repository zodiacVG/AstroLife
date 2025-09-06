from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import json
from pathlib import Path
from datetime import datetime

# 加载环境变量
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

app = FastAPI(
    title="星航预言家 API",
    description="基于航天器神谕的智能占卜系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://192.168.2.145:5173", "http://192.168.2.145:5174", "http://192.168.2.145:5175"],
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
    destiny_starship: Optional[AstroSpacecraft] = None
    timely_starship: Optional[AstroSpacecraft] = None
    question_starship: Optional[AstroSpacecraft] = None
    interpretation: Optional[str] = None

@app.get("/")
async def root():
    return {
        "message": "星航预言家 API 服务正常运行",
        "version": "1.0.0",
        "starships_count": len(starships_data.get('starships', []))
    }

@app.get("/starships")
async def get_starships():
    """获取所有航天器数据"""
    return starships_data

@app.get("/starships/{archive_id}")
async def get_starship(archive_id: str):
    """根据ID获取特定航天器"""
    starship = next((s for s in starships_data['starships'] if s['archive_id'] == archive_id), None)
    if not starship:
        raise HTTPException(status_code=404, detail="航天器未找到")
    return starship

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

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "model": os.getenv("ALIYUN_BAILIAN_MODEL"),
        "api_key_configured": bool(os.getenv("ALIYUN_BAILIAN_API_KEY"))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 8000)))