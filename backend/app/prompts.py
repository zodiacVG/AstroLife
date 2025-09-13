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
        # 项目整体语境与方法论（补充完整介绍，提升一致性与质量）
        "你正在为 AstroOracle项目生成最终解读。整体控制在 800 字以内。\n"
        "核心思路：依据用户的出生时间、本次提问的时间，以及问题语义，在航天器档案库中匹配到对应的太空航天器；"
        "据此得到‘本命/天时/问道’三艘星舟，并结合它们各自的特性与神谕文本来完成解读。"
        "三舟含义与来源：\n"
        "- 本命星舟：由用户的出生时间推导，代表长期底色与潜在航道；\n"
        "- 天时星舟：由本次提问发生的时间推导，代表外部风向与时机变换；\n"
        "- 问道星舟：将本次问题与航天器档案（语义/关键词/神谕意象）匹配得到，代表当下抉择的罗盘。\n"
        "你的任务：在统一的文字风格下，将三舟共同作用为一个结论\n\n"
        "明确立场：在你的开头就给出用户提问的明确回答，之后再展开详细解读；\n"
        "以冷静、克制、太空般疏离而富有诗意的语言，娓娓道来对下述问题的解读。"
        "文风含蓄而清晰：不浮夸，不鼓励，不寒暄，不使用表情符号。"
        "必须将三艘飞船以其名称自然写入文本，并说明它们如何相互作用指向结论。"
        "可以积极使用 markdown 格式，积极使用标题、编号或项目符号。可以使用一些严肃的，和太空相关的 emoji。\n\n"
        f"三艘飞船的神谕：\n{starships_text}\n\n"
        f"用户问题：{question_display}\n"
        f"{user_line}"
    )
