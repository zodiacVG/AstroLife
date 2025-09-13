"""
阿里云百炼模型服务模块
用于问题航天器匹配和神谕解读生成
"""

import json
import os
from typing import Dict, List, Optional
from openai import OpenAI
from .prompts import (
    build_selection_user_prompt,
    build_interpretation_user_prompt,
)

class LLMService:
    """阿里云百炼模型服务（统一命名：本命/天时/问道）"""
    
    def __init__(self):
        self.api_key = os.getenv("ALIYUN_BAILIAN_API_KEY")
        # 高质量主模型（用于最终解读/stream）：可配，默认 qwen-plus
        self.model = os.getenv("ALIYUN_BAILIAN_MODEL", "qwen-plus")
        # 低成本快速模型（仅用于问题航天器匹配）：可配，默认 qwen-flash
        self.fast_model = os.getenv("ALIYUN_BAILIAN_FAST_MODEL", "qwen-flash")
        
        if not self.api_key:
            # 尝试重新加载环境变量
            from dotenv import load_dotenv
            load_dotenv()
            self.api_key = os.getenv("ALIYUN_BAILIAN_API_KEY")
            
        if not self.api_key:
            raise ValueError("ALIYUN_BAILIAN_API_KEY环境变量未设置")
        
        # 创建OpenAI兼容客户端
        # 说明：旧版 openai SDK + httpx 兼容性问题已通过 pin httpx 解决
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )

        # 提示词不再放在服务内部，改由 prompts 模块集中管理
    
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
        
        # 构建航天器选择提示词（更严格、更可靠）
        prompt = build_selection_user_prompt(question, starships_data)
        
        try:
            # 使用低成本快速模型进行匹配
            response = await self._call_bailian_model(
                prompt,
                model=self.fast_model,
            )
            print('[LLM select_question_starship] raw:', (response[:200] + '...') if isinstance(response, str) else response)
            
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
        origin_starship: Optional[Dict],
        celestial_starship: Optional[Dict], 
        inquiry_starship: Optional[Dict],
        question: Optional[str],
        user_name: Optional[str] = None
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
        # 构建最终解读提示词（高质量、结构化、冷静风格）
        prompt = build_interpretation_user_prompt(
            origin_starship, celestial_starship, inquiry_starship, question, user_name
        )
        
        try:
            # 调用百炼模型生成解读（高质量主模型）
            response = await self._call_bailian_model(
                prompt,
                model=self.model,
            )
            return response.strip()
        except Exception as e:
            print(f"大模型生成解读失败: {e}")
            # 失败时回退到预定义文本
            return self._fallback_interpretation(
                origin_starship, celestial_starship, inquiry_starship, question
            )

    def stream_final_interpretation(
        self,
        origin_starship: Optional[Dict],
        celestial_starship: Optional[Dict],
        inquiry_starship: Optional[Dict],
        question: Optional[str],
        user_name: Optional[str] = None
    ):
        """流式生成神谕解读（OpenAI 兼容 streaming）。
        返回一个同步生成器，逐块yield文本，适配 FastAPI StreamingResponse。
        """
        prompt = build_interpretation_user_prompt(
            origin_starship, celestial_starship, inquiry_starship, question, user_name
        )
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                stream=True,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            for chunk in stream:
                delta = None
                # 兼容多种字段结构
                try:
                    delta = chunk.choices[0].delta.content
                except Exception:
                    try:
                        delta = chunk["choices"][0]["delta"]["content"]  # type: ignore[index]
                    except Exception:
                        delta = None
                if delta:
                    yield delta
        except Exception as e:
            # 失败时一次性回退
            fallback = self._fallback_interpretation(
                origin_starship, celestial_starship, inquiry_starship, question
            )
            yield fallback
    
    # 提示词构建已移至 prompts 模块
    
    async def _call_bailian_model(self, prompt: str, *, model: Optional[str] = None, system_prompt: Optional[str] = None) -> str:
        """调用阿里云百炼模型（OpenAI兼容）。默认不发送 system 消息。"""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            response = self.client.chat.completions.create(
                model=(model or self.model),
                messages=messages,
            )
            # 兼容响应格式：对象、dict、pydantic/base-model-like
            content = None
            try:
                content = response.choices[0].message.content
            except Exception:
                pass
            if content is None:
                try:
                    content = response['choices'][0]['message']['content']  # type: ignore[index]
                except Exception:
                    pass
            if content is None:
                try:
                    # openai>=1.0 models may support model_dump()
                    content = response.model_dump()['choices'][0]['message']['content']  # type: ignore[attr-defined]
                except Exception:
                    pass

            if content:
                return content
            else:
                raise Exception("模型调用失败: 无有效响应内容")
        except Exception as e:
            print(f"百炼模型调用失败: {e}")
            # 打印更多上下文信息，帮助排查
            try:
                import traceback
                traceback.print_exc()
            except Exception:
                pass
            raise
    
    def _parse_starship_selection(self, response: str) -> Optional[str]:
        """解析航天器选择响应"""
        lines = response.split('\n') if isinstance(response, str) else []
        for line in lines:
            if line.startswith('SELECTED_ID:'):
                return line.split('SELECTED_ID:')[1].strip()
        return None
    
    def _fallback_interpretation(
        self,
        origin_starship: Optional[Dict],
        celestial_starship: Optional[Dict], 
        inquiry_starship: Optional[Dict],
        question: Optional[str]
    ) -> str:
        """大模型失败时的回退解读"""
        interpretations = []
        
        if origin_starship:
            interpretations.append(
                f"你的本命星舟{origin_starship['name_cn']}启示: {origin_starship['oracle_text']}"
            )
        if celestial_starship and celestial_starship != origin_starship:
            interpretations.append(
                f"当前天时星舟{celestial_starship['name_cn']}提醒: {celestial_starship['oracle_text'][:100]}..."
            )
        if inquiry_starship and question:
            interpretations.append(
                f"对于你的问题，{inquiry_starship['name_cn']}回应: {inquiry_starship['oracle_text']}"
            )
        
        if interpretations:
            return "\n\n".join(interpretations)
        else:
            return "星辰暂时沉默，请稍后再试或重新思考你的问题。宇宙的奥秘需要耐心和真诚才能揭示。"

# 全局LLM服务实例
def get_llm_service():
    return LLMService()
