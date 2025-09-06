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

# 核心占卜算法
def calculate_destiny_starship(birth_date: datetime, starships_data: List[Dict]) -> Tuple[Optional[Dict], float]:
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

def calculate_timely_starship(current_date: datetime, starships_data: List[Dict]) -> Tuple[Optional[Dict], float]:
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

async def calculate_question_starship(question: str, starships_data: List[Dict]) -> Tuple[Optional[Dict], float]:
    """
    计算问题航天器（使用LLM大模型智能选择）
    """
    if not question:
        return None, 0.0
    
    try:
        # 使用LLM大模型智能选择航天器
        llm_service = get_llm_service()
        selected_starship = await llm_service.select_question_starship(question, starships_data)
        
        if selected_starship:
            # 返回匹配的航天器和固定高分（因为是大模型选择的）
            return selected_starship, 0.9
        else:
            # 大模型选择失败，回退到关键词匹配
            return _fallback_keyword_matching(question, starships_data)
            
    except Exception as e:
        print(f"LLM选择问题航天器失败: {e}")
        # 失败时回退到关键词匹配
        return _fallback_keyword_matching(question, starships_data)

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
    destiny_starship: Optional[Dict], 
    timely_starship: Optional[Dict], 
    question_starship: Optional[Dict],
    question: Optional[str]
) -> str:
    """生成神谕解读文本（使用LLM大模型智能生成）"""
    if not destiny_starship or not timely_starship or not question_starship:
        return "无法生成完整的神谕解读，请确保所有航天器都已正确匹配。"
    
    try:
        # 使用LLM大模型生成最终解读
        llm_service = get_llm_service()
        final_interpretation = await llm_service.generate_final_interpretation(
            question, destiny_starship, timely_starship, question_starship
        )
        
        if final_interpretation:
            return final_interpretation
        else:
            # LLM生成失败，回退到预定义文本组合
            return _fallback_interpretation(destiny_starship, timely_starship, question_starship)
            
    except Exception as e:
        print(f"LLM生成神谕解读失败: {e}")
        # 失败时回退到预定义文本组合
        return _fallback_interpretation(destiny_starship, timely_starship, question_starship)

def _fallback_interpretation(destiny_starship: Dict, timely_starship: Dict, question_starship: Dict) -> str:
    """回退到预定义文本组合"""
    # 组合预定义文本
    interpretation_parts = []
    
    # 命运航天器解读
    if destiny_starship.get("oracle_interpretation"):
        interpretation_parts.append(f"命运航天器 {destiny_starship['name_cn']}：{destiny_starship['oracle_interpretation']}")
    
    # 时运航天器解读
    if timely_starship.get("oracle_interpretation"):
        interpretation_parts.append(f"时运航天器 {timely_starship['name_cn']}：{timely_starship['oracle_interpretation']}")
    
    # 问题航天器解读
    if question_starship.get("oracle_interpretation"):
        interpretation_parts.append(f"问题航天器 {question_starship['name_cn']}：{question_starship['oracle_interpretation']}")
    
    # 组合所有解读
    if interpretation_parts:
        return "\n\n".join(interpretation_parts)
    else:
        return "暂时无法为您提供神谕解读，请稍后再试。"

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
    destiny_starship, destiny_score = calculate_destiny_starship(birth_date, starships)
    timely_starship, timely_score = calculate_timely_starship(current_date, starships)
    question_starship, question_score = await calculate_question_starship(question, starships)
    
    # 生成解读（异步调用LLM）
    interpretation = await generate_interpretation(
        destiny_starship, timely_starship, question_starship, question
    )
    
    return {
        "birth_date": birth_date_str,
        "question": question,
        "destiny_starship": destiny_starship,
        "timely_starship": timely_starship,
        "question_starship": question_starship,
        "match_scores": {
            "destiny": round(destiny_score, 3),
            "timely": round(timely_score, 3),
            "question": round(question_score, 3)
        },
        "interpretation": interpretation,
        "calculation_time": current_date.isoformat(),
        "starships_count": len(starships)
    }