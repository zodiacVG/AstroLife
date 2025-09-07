// 航天器相关常量定义 - 前后端共享（最小化版本）

// 仅保留最必要的常量
export const CORE_CONSTANTS = {
  // 基础配置
  DATE_FORMAT: 'YYYY-MM-DD',
  MAX_MATCH_DAYS: 365,
  
  // API端点
  API_ENDPOINTS: {
    calculate: '/api/v1/calculate',
    starships: '/api/v1/starships',
    health: '/api/v1/health',
    // 预留：批量计算（后端尚未实现）
    batch_calculate: '/api/v1/batch/calculate',
    divine: {
      origin: '/api/v1/divine/origin',
      celestial: '/api/v1/divine/celestial',
      inquiry: '/api/v1/divine/inquiry',
      complete: '/api/v1/divine/complete',
    }
  },
  
  // 计算类型
  CALCULATION_TYPES: {
    'origin': {
      name: '本命星舟',
      description: '基于出生日期匹配最契合的航天器',
      prompt: '分析用户的出生日期与航天器发射日期的匹配度'
    },
    'timing': {
      name: '天时星舟',
      description: '基于当前日期匹配最有利的航天器',
      prompt: '分析当前日期与航天器发射日期的关联性'
    },
    'inquiry': {
      name: '问道星舟',
      description: '基于问题内容匹配最能提供启示的航天器',
      prompt: '分析用户问题的语义与航天器使命的关联度'
    }
  },
  
  // 错误消息
  ERROR_MESSAGES: {
    INVALID_DATE: '日期格式无效',
    SPACE_NOT_FOUND: '未找到航天器数据',
    INVALID_DATE_FORMAT: '日期格式错误，请使用YYYY-MM-DD格式',
    FUTURE_DATE: '出生日期不能是未来日期',
    TOO_OLD_DATE: '出生日期过早，请输入合理的日期',
    MISSING_INQUIRY: '问道星舟模式需要提供问题内容',
    CALCULATION_ERROR: '计算过程出现错误',
    API_TIMEOUT: '请求超时，请稍后重试',
    NETWORK_ERROR: '网络连接错误'
  }
} as const;
