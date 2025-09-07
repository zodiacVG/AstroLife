"""
星航预言家核心占卜算法模块
基于航天器神谕的智能匹配算法
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import random
import re
from pathlib import Path
import asyncio

# 导入LLM服务
from .llm_service import get_llm_service

# 加载航天器数据
def load_starships_data() -> Dict:
    """加载航天器数据"""
    import os
    # 使用正确的绝对路径 - 从项目根目录开始
    # 当前文件路径: /backend/app/oracle_algorithm.py
    # 项目根目录: /Users/zodiacmac/Development/AstroLife
    backend_dir = os.path.dirname(os.path.abspath(__file__))  # /backend/app
    project_root = os.path.dirname(os.path.dirname(backend_dir))  # /Users/zodiacmac/Development/AstroLife
    data_path = os.path.join(project_root, "shared", "astro_data", "starships.json")
    
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise Exception(f"航天器数据文件未找到: {data_path}")

# 日期处理函数
def parse_date(date_str: str) -> datetime:
    """解析日期字符串"""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise ValueError("日期格式错误，请使用YYYY-MM-DD格式")

def calculate_date_difference(date1: datetime, date2: datetime) -> int:
    """计算两个日期之间的天数差"""
    return abs((date1 - date2).days)

# 关键词匹配算法
def preprocess_text(text: str) -> List[str]:
    """预处理文本，提取关键词"""
    # 移除标点符号
    text = re.sub(r'[^\w\s]', '', text)
    # 转换为小写并分词
    words = text.lower().split()
    # 过滤停用词（简单版本）
    stop_words = {'的', '了', '在', '是', '我', '你', '他', '她', '它', '我们', '你们', '他们', '什么', '怎么', '为什么', '如何'}
    return [word for word in words if word not in stop_words and len(word) > 1]

def calculate_keyword_similarity(question_words: List[str], spacecraft_keywords: List[str]) -> float:
    """计算问题关键词与航天器关键词的相似度"""
    if not question_words or not spacecraft_keywords:
        return 0.0
    
    # 计算匹配的关键词数量
    matched_keywords = set(question_words) & set(spacecraft_keywords)
    match_score = len(matched_keywords) / len(set(question_words))
    
    return min(match_score, 1.0)

# 核心占卜算法（统一命名：origin/celestial/inquiry）
def calculate_origin_starship(birth_date: datetime, starships_data: List[Dict]) -> Tuple[Optional[Dict], float]:
    """
    计算命运航天器（基于出生日期）
    返回匹配的航天器和匹配分数
    """
    best_match = None
    best_score = 0.0
    
    for starship in starships_data:
        try:
            launch_date = parse_date(starship["launch_date"])
            date_diff = calculate_date_difference(birth_date, launch_date)
            
            # 计算匹配分数（天数差越小，分数越高）
            score = 1.0 / (1 + date_diff / 365)  # 归一化到0-1之间
            
            if score > best_score:
                best_score = score
                best_match = starship
        except (ValueError, KeyError):
            continue
    
    return best_match, best_score

def calculate_celestial_starship(current_date: datetime, starships_data: List[Dict]) -> Tuple[Optional[Dict], float]:
    """
    计算时运航天器（基于当前日期）
    """
    best_match = None
    best_score = 0.0
    
    for starship in starships_data:
        try:
            launch_date = parse_date(starship["launch_date"])
            date_diff = calculate_date_difference(current_date, launch_date)
            
            # 计算匹配分数
            score = 1.0 / (1 + date_diff / 30)  # 更关注近期的匹配
            
            if score > best_score:
                best_score = score
                best_match = starship
        except (ValueError, KeyError):
            continue
    
    return best_match, best_score

async def calculate_inquiry_starship(question: str, starships_data: List[Dict]) -> Tuple[Optional[Dict], float]:
    """计算问题航天器：仅允许使用 LLM，不进行关键词回退"""
    if not question:
        return None, 0.0
    try:
        llm_service = get_llm_service()
        selected_starship = await llm_service.select_question_starship(question, starships_data)
        if selected_starship:
            return selected_starship, 0.9
        # LLM未能选择返回空
        return None, 0.0
    except Exception as e:
        print(f"LLM选择问题航天器失败: {e}")
        # 不允许关键词回退，直接返回空
        return None, 0.0

def _fallback_keyword_matching(question: str, starships_data: List[Dict]) -> Tuple[Optional[Dict], float]:
    """回退到关键词匹配算法"""
    best_match = None
    best_score = 0.0
    question_words = preprocess_text(question)
    
    for starship in starships_data:
        try:
            keywords = [kw.lower() for kw in starship.get("oracle_keywords", [])]
            score = calculate_keyword_similarity(question_words, keywords)
            
            if score > best_score:
                best_score = score
                best_match = starship
        except (KeyError, AttributeError):
            continue
    
    return best_match, best_score

async def generate_interpretation(
    origin_starship: Optional[Dict], 
    celestial_starship: Optional[Dict], 
    inquiry_starship: Optional[Dict],
    question: Optional[str]
) -> str:
    """生成神谕解读文本（使用LLM大模型智能生成）"""
    if not origin_starship or not celestial_starship or not inquiry_starship:
        return "无法生成完整的神谕解读，请确保所有航天器都已正确匹配。"
    
    try:
        # 使用LLM大模型生成最终解读
        llm_service = get_llm_service()
        # 参数顺序：origin, celestial, inquiry, question
        final_interpretation = await llm_service.generate_final_interpretation(
            origin_starship, celestial_starship, inquiry_starship, question
        )
        
        if final_interpretation:
            return final_interpretation
        else:
            # LLM生成失败，回退到预定义文本组合
            return _fallback_interpretation(origin_starship, celestial_starship, inquiry_starship)
            
    except Exception as e:
        print(f"LLM生成神谕解读失败: {e}")
        # 失败时回退到预定义文本组合
        return _fallback_interpretation(origin_starship, celestial_starship, inquiry_starship)

def _fallback_interpretation(origin_starship: Dict, celestial_starship: Dict, inquiry_starship: Dict) -> str:
    """回退到预定义文本组合"""
    # 组合预定义文本
    interpretation_parts = []
    
    # 命运航天器解读
    if origin_starship.get("oracle_interpretation"):
        interpretation_parts.append(f"本命星舟 {origin_starship['name_cn']}：{origin_starship['oracle_interpretation']}")
    
    # 时运航天器解读
    if celestial_starship.get("oracle_interpretation"):
        interpretation_parts.append(f"天时星舟 {celestial_starship['name_cn']}：{celestial_starship['oracle_interpretation']}")
    
    # 问题航天器解读
    if inquiry_starship.get("oracle_interpretation"):
        interpretation_parts.append(f"问道星舟 {inquiry_starship['name_cn']}：{inquiry_starship['oracle_interpretation']}")
    
    # 组合所有解读
    if interpretation_parts:
        return "\n\n".join(interpretation_parts)
    else:
        return "暂时无法为您提供神谕解读，请稍后再试。"

def stream_oracle_interpretation(
    origin_starship: Dict,
    celestial_starship: Dict,
    inquiry_starship: Dict,
    question: Optional[str]
):
    """流式生成最终神谕解读（生成器）。

    直接把三艘飞船与问题交给 LLM 的 streaming 接口，逐块 yield 文本。
    前端通过 SSE 接口消费本生成器的增量片段。
    """
    if not origin_starship or not celestial_starship or not inquiry_starship:
        def _gen():
            yield "缺少必要的飞船，无法生成完整解读。"
        return _gen()

    try:
        llm_service = get_llm_service()
        return llm_service.stream_final_interpretation(
            origin_starship, celestial_starship, inquiry_starship, question
        )
    except Exception:
        # 回退为一次性组合文本
        def _gen2():
            yield _fallback_interpretation(origin_starship, celestial_starship, inquiry_starship)
        return _gen2()

async def calculate_oracle(
    birth_date_str: str, 
    question: Optional[str] = None
) -> Dict:
    """
    主占卜函数（异步版本，支持LLM集成）
    返回完整的占卜结果
    """
    # 加载数据
    data = load_starships_data()
    starships = data.get("starships", [])
    
    # 解析日期
    birth_date = parse_date(birth_date_str)
    current_date = datetime.now()
    
    # 计算三个航天器
    origin_starship, origin_score = calculate_origin_starship(birth_date, starships)
    celestial_starship, celestial_score = calculate_celestial_starship(current_date, starships)
    inquiry_starship, inquiry_score = await calculate_inquiry_starship(question, starships)
    
    # 生成解读（异步调用LLM）
    interpretation = await generate_interpretation(
        origin_starship, celestial_starship, inquiry_starship, question
    )
    
    return {
        "birth_date": birth_date_str,
        "question": question,
        "starships": {
            "origin": origin_starship,
            "celestial": celestial_starship,
            "inquiry": inquiry_starship
        },
        "match_scores": {
            "origin": round(origin_score, 3),
            "celestial": round(celestial_score, 3),
            "inquiry": round(inquiry_score, 3)
        },
        "interpretation": interpretation,
        "calculation_time": current_date.isoformat(),
        "starships_count": len(starships)
    }
