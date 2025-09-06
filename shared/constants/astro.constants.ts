// 航天器相关常量定义 - 前后端共享

// 任务类型映射
export const MISSION_TYPES = {
  'orbiter': '轨道器',
  'lander': '着陆器',
  'rover': '巡视器',
  'flyby': '飞掠器',
  'sample_return': '采样返回',
  'telescope': '太空望远镜',
  'communication': '通信卫星',
  'weather': '气象卫星',
  'navigation': '导航卫星',
  'space_station': '空间站'
} as const;

// 航天器状态
export const SPACECRAFT_STATUS = {
  'operational': '运行中',
  'completed': '任务完成',
  'failed': '任务失败',
  'planned': '计划中',
  'development': '研制中'
} as const;

// 计算类型定义
export const CALCULATION_TYPES = {
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
} as const;

// 关键词权重配置
export const KEYWORD_WEIGHTS = {
  'exact_match': 1.0,
  'synonym_match': 0.8,
  'related_match': 0.6,
  'broad_match': 0.4
} as const;

// 日期计算配置
export const DATE_CALCULATION = {
  'perfect_match_days': 0,
  'good_match_days': 30,
  'acceptable_match_days': 90,
  'max_consider_days': 365
} as const;

// API端点配置
export const API_ENDPOINTS = {
  'calculate': '/api/calculate',
  'spacecraft': '/api/spacecraft',
  'health': '/api/health',
  'batch_calculate': '/api/batch/calculate'
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  'INVALID_DATE_FORMAT': '日期格式错误，请使用YYYY-MM-DD格式',
  'FUTURE_DATE': '出生日期不能是未来日期',
  'TOO_OLD_DATE': '出生日期过早，请输入合理的日期',
  'MISSING_INQUIRY': '问道星舟模式需要提供问题内容',
  'SPACE_NOT_FOUND': '未找到匹配的航天器',
  'CALCULATION_ERROR': '计算过程出现错误',
  'API_TIMEOUT': '请求超时，请稍后重试',
  'NETWORK_ERROR': '网络连接错误'
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  'CALCULATION_COMPLETE': '计算完成',
  'DATA_LOADED': '数据加载成功',
  'CACHE_UPDATED': '缓存更新成功'
} as const;

// 缓存配置
export const CACHE_CONFIG = {
  'spacecraft_data_ttl': 3600, // 1小时
  'calculation_result_ttl': 300, // 5分钟
  'max_cache_size': 100 // 最大缓存条目数
} as const;

// 分页配置
export const PAGINATION = {
  'default_page_size': 20,
  'max_page_size': 100
} as const;

// 时间格式
export const DATE_FORMATS = {
  'ISO_DATE': 'YYYY-MM-DD',
  'DISPLAY_DATE': 'YYYY年MM月DD日',
  'API_DATE': 'YYYY-MM-DD'
} as const;

// 正则表达式
export const REGEX_PATTERNS = {
  'ISO_DATE': /^\d{4}-\d{2}-\d{2}$/,
  'CHINESE_DATE': /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
  'SPACE_TRIM': /\s+/g
} as const;