# 星航预言家三体共鸣占卜系统 API 接口文档

## 概述

本文档定义了星航预言家三体共鸣占卜系统的完整API接口规范。系统基于17艘真实航天器的发射数据，通过三体分离计算模式，为用户提供个性化的神秘占卜体验。

## 基础信息

- **Base URL**: `https://api.astrolife.com`
- **API Version**: `v1`
- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`

## 数据模型

### 星舟对象 (Starship)

```json
{
  "archive_id": "001",
  "name_cn": "史普尼克1号",
  "name_official": "Спутник-1",
  "launch_date": "1957-10-04",
  "operator": "苏联",
  "mission_description": "世界首颗人造地球卫星，1957年10月4日发射...",
  "status": "已完成",
  "oracle_keywords": ["勇气", "人类", "突破", "开拓先锋", "敢为天下先的开创精神"],
  "oracle_text": "人类将首次挣脱地球引力的枷锁..."
}
```

### 星舟结果对象 (StarshipResult)

```json
{
  "starship": { /* Starship对象 */ },
  "calculation": "基于出生月日1957-10-04的差值计算"
}
```

### 神谕响应对象 (OracleResponse)

```json
{
  "inquiry_id": "uuid",
  "user_name": "张三",
  "inquiry_date": "2024-01-15",
  "question": "我的事业何时能有所突破？",
  "starships": {
    "origin": { /* StarshipResult对象 */ },
    "inquiry": { /* StarshipResult对象 */ },
    "celestial": { /* StarshipResult对象 */ }
  },
  "oracle": {
    "title": "《三体共鸣：命运星图》",
    "text": "在浩瀚的宇宙中，三艘星舟为你奏响命运的交响曲...",
    "keywords": ["坚持", "机遇", "突破"]
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

## API 端点

### 1. 获取所有星舟列表

**GET** `/api/v1/starships`

获取所有17艘星舟的完整信息。

#### 响应示例

```json
{
  "total": 17,
  "starships": [
    { /* Starship对象 */ },
    { /* Starship对象 */ }
  ]
}
```

### 2. 计算本命星舟

**POST** `/api/v1/divine/origin`

根据用户的出生日期计算本命星舟。

#### 请求体

```json
{
  "birth_date": "1990-05-15"
}
```

#### 响应示例

```json
{
  "starship": { /* Starship对象 */ },
  "calculation": "基于出生月日05-15与发射月日10-04的差值计算"
}
```

### 3. 计算天时星舟

**POST** `/api/v1/divine/celestial`

根据提问日期计算天时星舟。

#### 请求体

```json
{
  "inquiry_date": "2024-01-15"
}
```

#### 响应示例

```json
{
  "starship": { /* Starship对象 */ },
  "calculation": "基于提问月日01-15与发射月日09-05的差值计算"
}
```

### 4. 选择问道星舟

**POST** `/api/v1/divine/inquiry`

根据用户问题和当前星象选择问道星舟。

#### 请求体

```json
{
  "question": "我的事业何时能有所突破？",
  "inquiry_date": "2024-01-15"
}
```

#### 响应示例

```json
{
  "starship": { /* Starship对象 */ },
  "calculation": "基于问题语义分析选择：事业突破主题匹配毅力号火星车的探索精神"
}
```

### 5. 生成完整神谕

**POST** `/api/v1/divine/oracle`

基于三艘星舟生成完整神谕。

#### 请求体

```json
{
  "user_name": "张三",
  "birth_date": "1990-05-15",
  "inquiry_date": "2024-01-15",
  "question": "我的事业何时能有所突破？",
  "starships": {
    "origin": "001",
    "inquiry": "014",
    "celestial": "004"
  }
}
```

#### 响应示例

```json
{
  "inquiry_id": "uuid",
  "user_name": "张三",
  "inquiry_date": "2024-01-15",
  "question": "我的事业何时能有所突破？",
  "starships": {
    "origin": { /* StarshipResult对象 */ },
    "inquiry": { /* StarshipResult对象 */ },
    "celestial": { /* StarshipResult对象 */ }
  },
  "oracle": {
    "title": "《三体共鸣：命运星图》",
    "text": "在浩瀚的宇宙中，三艘星舟为你奏响命运的交响曲...",
    "keywords": ["坚持", "机遇", "突破"]
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 6. 完整占卜流程

**POST** `/api/v1/divine/complete`

一键完成完整的占卜流程，自动计算三艘星舟并生成神谕。

#### 请求体

```json
{
  "user_name": "张三",
  "birth_date": "1990-05-15",
  "question": "我的事业何时能有所突破？"
}
```

#### 响应示例

```json
{
  "inquiry_id": "uuid",
  "user_name": "张三",
  "inquiry_date": "2024-01-15",
  "question": "我的事业何时能有所突破？",
  "starships": {
    "origin": { /* StarshipResult对象 */ },
    "inquiry": { /* StarshipResult对象 */ },
    "celestial": { /* StarshipResult对象 */ }
  },
  "oracle": {
    "title": "《三体共鸣：命运星图》",
    "text": "在浩瀚的宇宙中，三艘星舟为你奏响命运的交响曲...",
    "keywords": ["坚持", "机遇", "突破"]
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 7. 获取占卜历史

**GET** `/api/v1/divine/history`

获取用户的占卜历史记录。

#### 查询参数

- `user_id` (可选): 用户ID
- `limit` (可选): 返回记录数量，默认20，最大100

#### 响应示例

```json
{
  "total": 42,
  "history": [
    {
      "inquiry_id": "uuid",
      "user_name": "张三",
      "inquiry_date": "2024-01-15",
      "question": "我的事业何时能有所突破？",
      "starships": {
        "origin": { /* StarshipResult对象 */ },
        "inquiry": { /* StarshipResult对象 */ },
        "celestial": { /* StarshipResult对象 */ }
      },
      "oracle": {
        "title": "《三体共鸣：命运星图》",
        "keywords": ["坚持", "机遇", "突破"]
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 8. 保存占卜记录

**POST** `/api/v1/divine/history`

保存占卜结果到历史记录。

#### 请求体

```json
{
  "inquiry_id": "uuid",
  "user_name": "张三",
  "birth_date": "1990-05-15",
  "inquiry_date": "2024-01-15",
  "question": "我的事业何时能有所突破？",
  "starships": {
    "origin": "001",
    "inquiry": "014",
    "celestial": "004"
  },
  "oracle": {
    "title": "《三体共鸣：命运星图》",
    "text": "在浩瀚的宇宙中，三艘星舟为你奏响命运的交响曲...",
    "keywords": ["坚持", "机遇", "突破"]
  }
}
```

### 9. 获取单个星舟详情

**GET** `/api/v1/starships/{archive_id}`

获取特定星舟的详细信息。

#### 路径参数

- `archive_id`: 星舟档案ID (001-017)

#### 响应示例

```json
{
  "archive_id": "001",
  "name_cn": "史普尼克1号",
  "name_official": "Спутник-1",
  "launch_date": "1957-10-04",
  "operator": "苏联",
  "mission_description": "世界首颗人造地球卫星，1957年10月4日发射...",
  "status": "已完成",
  "oracle_keywords": ["勇气", "人类", "突破", "开拓先锋", "敢为天下先的开创精神"],
  "oracle_text": "人类将首次挣脱地球引力的枷锁..."
}
```

## 计算算法

### 本命星舟计算
1. 提取用户出生月日 (MM-DD)
2. 计算与每艘星舟发射月日的绝对差值
3. 选择差值最小的星舟作为本命星舟

### 天时星舟计算
1. 提取提问月日 (MM-DD)
2. 计算与每艘星舟发射月日的绝对差值
3. 选择差值最小的星舟作为天时星舟

### 差值计算公式
```
差值 = |用户月日 - 星舟发射月日|
跨年处理：如果差值 > 183天，使用 365 - 差值
```

## 错误处理

### 错误响应格式

```json
{
  "error": {
    "code": "INVALID_DATE_FORMAT",
    "message": "日期格式错误，请使用YYYY-MM-DD格式",
    "details": {
      "field": "birth_date",
      "value": "1990/05/15"
    }
  }
}
```

### 错误码表

| 错误码                     | 描述             | HTTP状态 |
| -------------------------- | ---------------- | -------- |
| `INVALID_DATE_FORMAT`      | 日期格式错误     | 400      |
| `INVALID_ARCHIVE_ID`       | 无效的星舟档案ID | 400      |
| `MISSING_REQUIRED_FIELD`   | 缺少必填字段     | 400      |
| `STARSHIP_NOT_FOUND`       | 星舟不存在       | 404      |
| `ORACLE_GENERATION_FAILED` | 神谕生成失败     | 500      |
| `LLM_SERVICE_ERROR`        | LLM服务错误      | 503      |
| `RATE_LIMIT_EXCEEDED`      | 请求频率超限     | 429      |

## 速率限制

- **通用限制**: 每个IP每分钟100次请求
- **占卜相关**: 每个用户每小时10次完整占卜
- **星舟数据**: 无限制

## 缓存策略

- **星舟列表**: 缓存24小时
- **计算结果**: 缓存1小时
- **神谕内容**: 缓存30分钟

## 使用示例

### 完整占卜流程

```bash
# 1. 获取星舟列表
curl https://api.astrolife.com/api/v1/starships

# 2. 计算本命星舟
curl -X POST https://api.astrolife.com/api/v1/divine/origin \
  -H "Content-Type: application/json" \
  -d '{"birth_date": "1990-05-15"}'

# 3. 计算天时星舟
curl -X POST https://api.astrolife.com/api/v1/divine/celestial \
  -H "Content-Type: application/json" \
  -d '{"inquiry_date": "2024-01-15"}'

# 4. 选择问道星舟
curl -X POST https://api.astrolife.com/api/v1/divine/inquiry \
  -H "Content-Type: application/json" \
  -d '{"question": "我的事业何时能有所突破？", "inquiry_date": "2024-01-15"}'

# 5. 一键完成占卜
curl -X POST https://api.astrolife.com/api/v1/divine/complete \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "张三",
    "birth_date": "1990-05-15",
    "question": "我的事业何时能有所突破？"
  }'
```