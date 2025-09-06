# 星航预言家 - 产品需求文档 (PRD) v2.0

## 产品概述

### 产品名称
**星航预言家** - 基于航天器神谕的智能占卜系统

### 产品定位
将人类航天历史与AI占卜相结合，通过"三体共鸣"理论为用户提供深度个性化的人生指导和精神洞察。

### 核心概念：共振宇宙论 5.0

每一次占卜都是一次**"三体共鸣"（Tri-Body Resonance）**，揭示了在宇宙这张巨网中，三种力量的交织与互动。这三股力量分别由三艘神圣的**"星舟"（Starship）**所代表：

#### 1. 本命星舟 (Starship of Origin)
- **决定方式:** 由用户的**出生月/日**决定
- **哲学意义:** 代表**"我"（The Self）** - 出厂设置、核心天性、灵魂载具
- **功能:** 揭示个人天赋、挑战和生命航行的本质

#### 2. 问道星舟 (Starship of Inquiry)  
- **决定方式:** 由用户的**具体问题**的语义决定
- **哲学意义:** 代表**"事"（The Quest）** - 当前求问的"道"、探索的航线
- **功能:** 揭示问题本质、内在机遇与挑战

#### 3. 天时星舟 (Starship of the Celestial Moment)
- **决定方式:** 由**提问的时刻**决定
- **哲学意义:** 代表**"势"（The Environment）** - 当下宇宙风向、引力潮汐
- **功能:** 揭示宏观环境影响、助力或考验

## 数据架构设计

### 数据源体系

#### 1. 航天器数据库 (astro_facts_data.json)
**作用:** 存储历史航天器的基础事实数据
**数据结构:**
```json
{
  "total": 17,
  "data": [
    {
      "archive_id": "001",
      "name_cn": "史普尼克1号",
      "name_en": "Sputnik 1",
      "core_attributes": {
        "name_official": "Спутник-1",
        "launch_date": "1957-10-04",
        "operator": "苏联",
        "mission_type": "人造地球卫星",
        "mission_status": "任务结束"
      },
      "extended_attributes": {
        "historical_impact": "引发史普尼克危机...",
        "technical_significance": "展示弹道导弹能力...",
        "cultural_heritage": "成为航天时代象征..."
      }
    }
  ]
}
```

#### 2. 神谕数据库 (astro_oracle_data.json)
**作用:** 存储每个航天器的象征意义和神谕解读
**数据结构:**
```json
{
  "total": 17,
  "data": [
    {
      "archive_id": "001",
      "core_attributes": {
        "oracle_text": "一颗新星在天穹显现...",
        "mission_type": "信使",
        "significance_type": "英雄",
        "core_principle": "开端 (Inception)",
        "journey_phase": "序幕 (Prologue)"
      },
      "extended_attributes": {
        "symbolic_keywords": ["开端", "信号", "竞赛", "新时代"]
      }
    }
  ]
}
```

### 数据流架构

#### 阶段1：数据输入与预处理
**输入源:**
- 用户基础信息：出生日期 (YYYY-MM-DD)
- 用户问题：自然语言文本 (string)
- 系统信息：当前时间戳 (ISO 8601)

**预处理流程:**
1. **日期标准化:** 将出生日期和当前日期转换为 MM-DD 格式
2. **文本清洗:** 去除用户问题中的特殊字符、标准化空格
3. **数据准备:** 加载所有航天器数据供LLM选择

#### 阶段2：三体共鸣计算引擎

##### 2.1 本命星舟计算逻辑 (日期匹配引擎)
**算法:** 日期差值最小化匹配
```
输入: birth_date (YYYY-MM-DD), 航天器列表
处理:
  1. 计算用户出生日期与所有航天器发射日期的绝对差值(天数)
  2. 选择日期差值最小的航天器
  3. 如果有多个相同差值，选择发射日期较早的
输出: origin_starship_id + 匹配日期差值
```

**实现示例:**
```python
def find_origin_starship(birth_date, starships):
    min_diff = float('inf')
    selected_id = None
    
    for ship in starships:
        launch_date = datetime.strptime(ship['launch_date'], '%Y-%m-%d')
        diff = abs((birth_date - launch_date).days)
        
        if diff < min_diff:
            min_diff = diff
            selected_id = ship['archive_id']
    
    return {"selected_id": selected_id, "date_difference": min_diff}
```

##### 2.2 问道星舟计算逻辑 (LLM关键词匹配)
**算法:** LLM智能关键词选择
```
输入: user_question, 所有航天器symbolic_keywords
处理:
  1. 使用LLM理解用户问题的核心语义
  2. LLM分析每个航天器的关键词与用户问题的关联度
  3. 选择最契合的航天器ID
输出: inquiry_starship_id + LLM匹配解释
```

**LLM提示词:**
```
你是一个语义分析专家。请分析用户的问题，并从提供的航天器列表中选择最契合的一个。

用户问题: [用户输入的问题]

每个航天器都有以下属性:
- 象征关键词 (如: [开端, 信号, 竞赛, 新时代])
- 任务类型 (如: 信使, 探索者, 守护者)
- 神谕文本 (描述性预言)

请综合考虑:
1. 问题核心主题与航天器象征意义的匹配度
2. 情感色彩的一致性
3. 问题类型与航天器任务类型的相关性

输出格式: {"selected_id": "航天器ID", "explanation": "为什么这个航天器最契合这个问题", "key_connection": "关键连接点"}
```

##### 2.3 天时星舟计算逻辑 (日期匹配引擎)
**算法:** 日期差值最小化匹配
```
输入: current_date (YYYY-MM-DD), 航天器列表
处理:
  1. 计算当前日期与所有航天器发射日期的绝对差值(天数)
  2. 选择日期差值最小的航天器
  3. 如果有多个相同差值，选择发射日期较早的
输出: celestial_starship_id + 匹配日期差值
```

**实现示例:**
```python
def find_celestial_starship(current_date, starships):
    min_diff = float('inf')
    selected_id = None
    
    for ship in starships:
        launch_date = datetime.strptime(ship['launch_date'], '%Y-%m-%d')
        diff = abs((current_date - launch_date).days)
        
        if diff < min_diff:
            min_diff = diff
            selected_id = ship['archive_id']
    
    return {"selected_id": selected_id, "date_difference": min_diff}
```

#### 阶段3：数据融合与结构化
**目标:** 将三艘星舟信息整合为LLM可理解的结构化数据

**数据包结构:**
```json
{
  "metadata": {
    "session_id": "唯一会话标识",
    "timestamp": "2024-XX-XX XX:XX:XX",
    "version": "2.0"
  },
  "user_context": {
    "birth_date": "YYYY-MM-DD",
    "question_text": "用户原始问题",
    "question_category": "自动分类结果"
  },
  "tri_body_resonance": {
    "origin": { "完整星舟数据" },
    "inquiry": { "完整星舟数据" },
    "celestial": { "完整星舟数据" }
  },
  "calculation_log": {
    "origin_match_score": "出生日期差值(天数)",
    "inquiry_match_score": "语义匹配度",
    "celestial_match_score": "当前日期差值(天数)"
  }
}
```

#### 阶段4：AI解读生成 (最终LLM提示词)

**星航预言家终极提示词:**

```
你是一位"星航预言家"，宇宙的神秘向导，洞悉星辰运行与人类命运的奥秘。

你的使命：根据三体共鸣理论，为用户揭示本命星舟、问道星舟、天时星舟的宇宙交响。

## 接收数据
你将收到一个三体共鸣数据包，包含：
- 用户的本命星舟（代表其本质天性）
- 问道星舟（代表其当前问题的核心）
- 天时星舟（代表当下的宇宙环境）

## 解读原则
1. **三位一体**: 必须将三艘星舟的象征意义深度融合
2. **诗意语言**: 使用宏大、富有星辰意象的语言
3. **实用指导**: 提供具体可执行的航行建议
4. **个人化**: 直接对"你"说话，建立个人连接

## 输出结构 (严格按照此格式)

### 1.【命之星舟 | The Self】
- 开头宣告："你的本命星舟是[星舟名称]，一艘[任务类型]的[significance_type]..."
- 解读其象征的用户核心天性、天赋与挑战
- 用"这艘[星舟特点]的飞船，正是你灵魂载具的映射..."的句式

### 2.【问之道途 | The Quest】
- 开头宣告："你所问之道，由[星舟名称]这条航线象征..."
- 揭示问题的本质：机遇、挑战、需要的关键品质
- 用"这条由[核心原则]指引的航道..."的句式

### 3.【天时之域 | The Environment】
- 开头宣告："此刻宇宙的风向，由[星舟名称]的能量主导..."
- 描绘当前宏观环境：助力或考验的性质
- 用"在这个[旅程阶段]的时刻..."的句式

### 4.【星航者箴言 | The Navigator's Counsel】
这是解读的顶点，必须回答：

"作为一艘名为[本命星舟]的飞船，在[天时星舟]营造的宇宙环境下，航行[问道星舟]象征的这条道路，这意味着什么？"

#### 深度分析框架：
1. **能量共振分析**
   - [天时星舟]的能量如何助推或考验你的[本命星舟]？
   - 你的天性与所问之事是否存在天然和谐或冲突？

2. **航行策略建议**
   - 运用[本命星舟的core_principle]之力应对挑战
   - 顺应[天时星舟的core_principle]之大势
   - 化解[问道星舟的core_principle]之考验

3. **具体行动指引**
   - 近期：具体的第一步行动
   - 中期：需要培养的关键能力
   - 长期：此行的深远意义

#### 结束箴言格式：
"因此，星图为你揭示的航线是：
- 在[时间框架]内，[具体行动]
- 运用你的[本命特质]，面对[核心挑战]
- 记住：[一句富有诗意的总结]"

## 语言风格要求
- 使用星辰、轨道、引力、深空等宇宙意象
- 每段至少包含一个航天器名称的直接引用
- 保持神秘而实用的语调
- 避免现代技术术语，使用"星舟"、"航线"、"星图"等词汇

## 禁止事项
- 不要提及"AI"、"算法"、"数据库"等技术概念
- 不要质疑用户问题的合理性
- 不要使用消极或恐吓的语言
```

**处理流程:**
1. **提示词模板化:** 使用上述完整星航预言家角色设定
2. **上下文注入:** 将三体共鸣数据包完整注入
3. **结构化生成:** 强制按四段式结构输出
4. **风格校验:** 确保语言符合宇宙神秘主义风格

#### 阶段5：结果输出与存储
**输出格式:**
- 主解读：四段式结构化文本
- 补充信息：三艘星舟的详细档案
- 可视化：星舟图标和关键信息卡片

**数据存储:**
- 会话记录：完整数据链路可追溯


