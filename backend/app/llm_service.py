"""
阿里云百炼模型服务模块
用于问题航天器匹配和神谕解读生成
"""

import json
import os
from typing import Dict, List, Optional
from openai import OpenAI

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

        # 统一风格的系统提示词（用于生成与流式解读）
        self.system_prompt_interpretation = (
            "你是一位冷静、克制且精确的星航预言家。"
            "文风像深空回声：清澈、含蓄、带宇宙意象，但不拖泥带水。"
            "核心原则：\n"
            "- 明确立场：给出单一、可执行的答案与方向；\n"
            "- 三舟合参：在叙述中自然融入本命/天时/问道的信号，并指出它们的关系与优先级"
            "（问道=当下抉择的罗盘；天时=时机与风向；本命=长期底色）。\n"
            "- 禁止和稀泥与安抚式总结：不写诸如‘无论如何/都是宇宙的一部分/祝你好运/加油/你并非对错’等句子；\n"
            "- 禁止列表与标题：不使用‘行动指引：’、编号或项目符号；\n"
            "- 不使用表情符号；\n"
            "- 若有不确定性，仅冷静点明，同时仍需给出倾向性的建议。"
        )

        # 航天器匹配的系统提示（成本优先，输出严格）
        self.system_prompt_selection = (
            "你是一个选择器，任务是根据用户问题在给定航天器列表中选出最匹配的一艘。"
            "只输出一行，严格格式：SELECTED_ID: <ID>。不输出其它任何内容。"
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
        
        # 构建航天器选择提示词（更严格、更可靠）
        prompt = self._build_starship_selection_prompt(question, starships_data)
        
        try:
            # 使用低成本快速模型进行匹配
            response = await self._call_bailian_model(
                prompt,
                model=self.fast_model,
                system_prompt=self.system_prompt_selection,
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
        prompt = self._build_final_interpretation_prompt(
            origin_starship, celestial_starship, inquiry_starship, question, user_name
        )
        
        try:
            # 调用百炼模型生成解读（高质量主模型）
            response = await self._call_bailian_model(
                prompt,
                model=self.model,
                system_prompt=self.system_prompt_interpretation,
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
        prompt = self._build_final_interpretation_prompt(
            origin_starship, celestial_starship, inquiry_starship, question, user_name
        )
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                stream=True,
                messages=[
                    {"role": "system", "content": self.system_prompt_interpretation},
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
    
    def _build_starship_selection_prompt(
        self, 
        question: str, 
        starships_data: List[Dict]
    ) -> str:
        """构建航天器选择提示词（严格输出、成本优先）"""
        def _one(s: Dict) -> str:
            kws = ", ".join(s.get("oracle_keywords", []))
            oracle = (s.get("oracle_text") or "").strip().replace("\n", " ")
            if len(oracle) > 100:
                oracle = oracle[:100] + "..."
            return (
                f"ID: {s.get('archive_id')}; 名称: {s.get('name_cn')} ({s.get('name_official')}); "
                f"关键词: {kws}; 神谕: {oracle}"
            )

        starships_info = "\n".join([_one(s) for s in starships_data])

        return (
            "根据用户问题，在下列航天器中选出最匹配的一艘。\n"
            "匹配依据：优先语义主题与关键词相近，其次神谕意象呼应度；并考虑与问题的时效性/指向性。\n"
            "若多艘接近，选择与问题核心更直接、可执行指引性更强的一艘。\n"
            "只能返回一行、严格格式：SELECTED_ID: <ID>（不输出任何解释或其它字符）。\n\n"
            f"候选航天器：\n{starships_info}\n\n"
            f"用户问题：{question}\n"
        )
    
    def _build_final_interpretation_prompt(
        self,
        origin_starship: Optional[Dict],
        celestial_starship: Optional[Dict], 
        inquiry_starship: Optional[Dict],
        question: Optional[str],
        user_name: Optional[str] = None
    ) -> str:
        """构建最终解读提示词（结构化、冷静、先结论）"""
        starships_info = []
        
        if origin_starship:
            starships_info.append(
                f"本命星舟: {origin_starship['name_cn']} — {origin_starship['oracle_text']}"
            )
        if celestial_starship:
            starships_info.append(
                f"天时星舟: {celestial_starship['name_cn']} — {celestial_starship['oracle_text']}"
            )
        if inquiry_starship:
            starships_info.append(
                f"问道星舟: {inquiry_starship['name_cn']} — {inquiry_starship['oracle_text']}"
            )
        
        starships_text = "\n".join(starships_info) if starships_info else "暂无航天器匹配"
        
        # 处理空question的情况
        question_display = (
            question if question else "请基于三艘飞船的神谕，给出对我当下处境的明确解读与行动建议"
        )
        user_line = f"用户姓名：{user_name}\n" if user_name else ""

        return (
            "以冷静、克制、太空般疏离而富有诗意的语言，娓娓道来对下述问题的解读。"
            "文风含蓄而清晰：不浮夸，不鼓励，不寒暄，不使用表情符号。"
            "在叙述中自然给出明确答案与可执行指引，让读者无需猜测即可行动。"
            "可借用星际、引力、轨道、信标等意象，但保持精确与节制。"
            "必须将三艘飞船以其名称自然写入文本，并说明它们如何相互作用指向结论；若意见冲突，优先级为问道>天时>本命，同时简短说明本命对长期的影响。"
            "避免使用标题、编号或项目符号。若存在不确定之处，仅冷静点明。\n\n"
            f"三艘飞船的神谕：\n{starships_text}\n\n"
            f"用户问题：{question_display}\n"
            f"{user_line}"
        )
    
    async def _call_bailian_model(self, prompt: str, *, model: Optional[str] = None, system_prompt: Optional[str] = None) -> str:
        """调用阿里云百炼模型（OpenAI兼容）。支持自定义模型与系统提示。"""
        try:
            response = self.client.chat.completions.create(
                model=(model or self.model),
                messages=[
                    {"role": "system", "content": system_prompt or self.system_prompt_interpretation},
                    {"role": "user", "content": prompt},
                ],
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
