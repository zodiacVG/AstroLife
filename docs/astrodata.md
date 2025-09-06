# 航天器数据结构文档

## 数据文件结构

### starships.json
包含17条经典航天器任务数据，整合了原有的astro_facts_data.json和astro_oracle_data.json数据。

**字段说明**:
- `archive_id`: 唯一标识符 (001-017)
- `name_cn`: 中文名称
- `name_official`: 官方英文/俄文名称
- `launch_date`: 发射日期 (YYYY-MM-DD格式，空字符串表示未发射)
- `operator`: 运营机构 (NASA, CNSA, ESA等)
- `mission_description`: 任务描述 (包含历史意义和技术细节)
- `status`: 任务状态
- `oracle_keywords`: 占卜关键词数组
- `oracle_text`: 占卜文本

**状态值**:
- `"已完成"` - 已结束的任务
- `"任务成功"` - 达成主要目标的特殊任务
- `"任务失败"` - 因故障失败的任务
- `"任务中止"` - 被迫中止的任务
- `"任务进行中"` - 仍在运行的任务

## 使用示例

### 前端使用
```typescript
import starshipsData from '../shared/astro_data/starships.json'

// 获取所有任务
const missions = starshipsData.starships

// 筛选进行中任务
const activeMissions = missions.filter(m => m.status === "任务进行中")

// 按时间排序
const sortedMissions = missions.sort((a, b) => 
  new Date(b.launch_date).getTime() - new Date(a.launch_date).getTime()
)

// 获取占卜数据
const oracleData = missions.map(m => ({
  archive_id: m.archive_id,
  keywords: m.oracle_keywords,
  text: m.oracle_text
}))
```

### 后端使用
```python
import json
from pathlib import Path

# 读取数据
data_path = Path("../shared/astro_data/starships.json")
with open(data_path, 'r', encoding='utf-8') as f:
    starships_data = json.load(f)

# 获取特定运营商的任务
nasa_missions = [
    mission for mission in starships_data['starships'] 
    if 'NASA' in mission['operator']
]

# 获取占卜数据
oracle_data = [
    {
        'archive_id': mission['archive_id'],
        'keywords': mission['oracle_keywords'],
        'text': mission['oracle_text']
    }
    for mission in starships_data['starships']
]
```

## 数据更新

1. 直接编辑 JSON 文件
2. 提交到 Git
3. 前后端自动同步更新

## 数据验证

使用共享类型定义进行验证：
```typescript
import { AstroSpacecraft } from '../shared/types/astro.types'

const mission: AstroSpacecraft = {
  archive_id: "018",
  name_cn: "新任务",
  name_official: "New Mission",
  launch_date: "2024-01-01",
  operator: "CNSA",
  mission_description: "任务描述",
  status: "任务进行中"
}
```