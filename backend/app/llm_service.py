"""
阿里云百炼模型服务模块
用于问题航天器匹配和神谕解读生成
"""

import json
import os
from typing import Dict, List, Optional
from openai import OpenAI

class LLMService:
    """阿里云百炼模型服务"""
    
    def __init__(self):
        self.api_key = os.getenv("ALIYUN_BAILIAN_API_KEY")
        self.model = os.getenv("ALIYUN_BAILIAN_MODEL", "qwen-plus")
        
        if not self.api_key:
            # 尝试重新加载环境变量
            from dotenv import load_dotenv
            load_dotenv()
            self.api_key = os.getenv("ALIYUN_BAILIAN_API_KEY")
            
        if not self.api_key:
            raise ValueError("ALIYUN_BAILIAN_API_KEY环境变量未设置")
        
        # 创建OpenAI兼容客户端
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
    
    async def select_question_starship(
        self, 
        question: str, 
        starships_data: List[Dict]
    ) -> Optional[Dict]:
        """
        使用大模型智能选择问题航天器
        
        Args:
            question: 用户问题
            starships_data: 航天器数据列表
            
        Returns:
            匹配的航天器数据
        """
        if not question or not starships_data:
            return None
        
        # 构建航天器选择提示词
        prompt = self._build_starship_selection_prompt(question, starships_data)
        
        try:
            # 调用百炼模型
            response = await self._call_bailian_model(prompt)
            
            # 解析模型响应，提取选择的航天器ID
            selected_starship_id = self._parse_starship_selection(response)
            
            if selected_starship_id:
                # 查找匹配的航天器
                return next(
                    (s for s in starships_data 
                     if s.get("archive_id") == selected_starship_id), 
                    None
                )
            
        except Exception as e:
            print(f"大模型选择航天器失败: {e}")
            
        return None
    
    async def generate_final_interpretation(
        self,
        destiny_starship: Optional[Dict],
        timely_starship: Optional[Dict], 
        question_starship: Optional[Dict],
        question: Optional[str]
    ) -> str:
        """
        使用大模型生成最终的神谕解读
        
        Args:
            destiny_starship: 命运航天器数据
            timely_starship: 时运航天器数据
            question_starship: 问题航天器数据
            question: 用户问题
            
        Returns:
            生成的智能解读文本
        """
        # 构建最终解读提示词
        prompt = self._build_final_interpretation_prompt(
            destiny_starship, timely_starship, question_starship, question
        )
        
        try:
            # 调用百炼模型生成解读
            response = await self._call_bailian_model(prompt)
            return response.strip()
        except Exception as e:
            print(f"大模型生成解读失败: {e}")
            # 失败时回退到预定义文本
            return self._fallback_interpretation(
                destiny_starship, timely_starship, question_starship, question
            )
    
    def _build_starship_selection_prompt(
        self, 
        question: str, 
        starships_data: List[Dict]
    ) -> str:
        """构建航天器选择提示词"""
        starships_info = "\n".join([
            f"ID: {s['archive_id']}, 名称: {s['name_cn']} ({s['name_official']}), "
            f"关键词: {', '.join(s.get('oracle_keywords', []))}, "
            f"神谕: {s['oracle_text'][:100]}..."
            for s in starships_data
        ])
        
        return f"""你是一个星航预言家，需要根据用户的问题选择最匹配的航天器。

可选的航天器列表：
{starships_info}

用户问题：{question}

请根据航天器的神谕主题和关键词，选择最符合用户问题的航天器。
只需要返回选择的航天器ID，格式为：SELECTED_ID: [航天器ID]

不要解释原因，直接返回ID。"""
    
    def _build_final_interpretation_prompt(
        self,
        destiny_starship: Optional[Dict],
        timely_starship: Optional[Dict], 
        question_starship: Optional[Dict],
        question: Optional[str]
    ) -> str:
        """构建最终解读提示词"""
        starships_info = []
        
        if destiny_starship:
            starships_info.append(
                f"命运航天器: {destiny_starship['name_cn']} - {destiny_starship['oracle_text']}"
            )
        if timely_starship:
            starships_info.append(
                f"时运航天器: {timely_starship['name_cn']} - {timely_starship['oracle_text']}"
            )
        if question_starship:
            starships_info.append(
                f"问题航天器: {question_starship['name_cn']} - {question_starship['oracle_text']}"
            )
        
        starships_text = "\n".join(starships_info) if starships_info else "暂无航天器匹配"
        
        return f"""你是一个星航预言家，需要整合三艘宇宙飞船的神谕来回答用户的问题。

三艘飞船的神谕：
{starships_text}

用户问题：{question}

请生成一个综合性的神谕解读，结合三艘飞船的启示，用诗意而智慧的语言回答用户的问题。
解读应该包含：
1. 对用户问题的直接回应
2. 结合三艘飞船神谕的深度分析
3. 实用的建议和启示
4. 鼓励和正向的结尾

保持神秘而智慧的预言家风格，语言优美而有深度。"""
    
    async def _call_bailian_model(self, prompt: str) -> str:
        """调用阿里云百炼模型（使用OpenAI兼容模式）"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个星航预言家助手，需要根据航天器神谕回答问题。"},
                    {"role": "user", "content": prompt}
                ]
            )
            
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
            else:
                raise Exception("模型调用失败: 无有效响应内容")
        except Exception as e:
            print(f"百炼模型调用失败: {e}")
            raise
    
    def _parse_starship_selection(self, response: str) -> Optional[str]:
        """解析航天器选择响应"""
        lines = response.split('\n')
        for line in lines:
            if line.startswith('SELECTED_ID:'):
                return line.split('SELECTED_ID:')[1].strip()
        return None
    
    def _fallback_interpretation(
        self,
        destiny_starship: Optional[Dict],
        timely_starship: Optional[Dict], 
        question_starship: Optional[Dict],
        question: Optional[str]
    ) -> str:
        """大模型失败时的回退解读"""
        interpretations = []
        
        if destiny_starship:
            interpretations.append(
                f"你的命运航天器{destiny_starship['name_cn']}启示: {destiny_starship['oracle_text']}"
            )
        if timely_starship and timely_starship != destiny_starship:
            interpretations.append(
                f"当前时运航天器{timely_starship['name_cn']}提醒: {timely_starship['oracle_text'][:100]}..."
            )
        if question_starship and question:
            interpretations.append(
                f"对于你的问题，{question_starship['name_cn']}回应: {question_starship['oracle_text']}"
            )
        
        if interpretations:
            return "\n\n".join(interpretations)
        else:
            return "星辰暂时沉默，请稍后再试或重新思考你的问题。宇宙的奥秘需要耐心和真诚才能揭示。"

# 全局LLM服务实例
def get_llm_service():
    return LLMService()