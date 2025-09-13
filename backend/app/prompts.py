"""
LLM 提示词模块
将与大模型交互所需的提示词集中管理，避免散落在服务逻辑中。

包含两处提示词：
- 航天器匹配（选择器，低成本模型）
- 神谕解读（最终输出，高质量模型与流式）
"""

from typing import Dict, List, Optional


# ===== 航天器匹配（选择器） =====

def selection_system_prompt() -> str:
    """航天器匹配任务的系统提示。"""
    return (
        "你是一个选择器，任务是根据用户问题在给定航天器列表中选出最匹配的一艘。"
        "只输出一行，严格格式：SELECTED_ID: <ID>。不输出其它任何内容。"
    )


def build_selection_user_prompt(question: str, starships_data: List[Dict]) -> str:
    """构建用于航天器匹配的用户提示。"""

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


# ===== 神谕解读（最终输出/流式） =====

def interpretation_system_prompt() -> str:
    """神谕解读任务的系统提示。"""
    return (
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


def build_interpretation_user_prompt(
    origin_starship: Optional[Dict],
    celestial_starship: Optional[Dict],
    inquiry_starship: Optional[Dict],
    question: Optional[str],
    user_name: Optional[str] = None,
) -> str:
    """构建用于神谕解读的用户提示。"""

    starships_info: List[str] = []

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

    question_display = (
        question
        if question
        else "请基于三艘飞船的神谕，给出对我当下处境的明确解读与行动建议"
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

