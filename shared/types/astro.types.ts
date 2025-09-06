// 航天器数据类型定义 - 前后端共享

export interface AstroSpacecraft {
  archive_id: string;
  name_ch: string;
  name_en: string;
  launch_date: string; // YYYY-MM-DD
  mission_type: string;
  status: string;
  description: string;
  symbolic_keywords: string[];
  extended_attributes: ExtendedAttributes;
}

export interface ExtendedAttributes {
  mission_duration_days?: number;
  current_distance_km?: number;
  signal_delay_seconds?: number;
  power_status?: string;
  data_transmission_rate?: string;
  primary_objectives?: string[];
  discoveries?: string[];
  technical_specs?: TechnicalSpecs;
}

export interface TechnicalSpecs {
  mass_kg?: number;
  power_watts?: number;
  communication_frequency?: string;
  instruments?: string[];
}

// API响应类型
export interface AstroResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

// 计算结果类型
export interface CalculationResult {
  user_id: string;
  inquiry: string;
  birth_date: string;
  calculation_type: 'origin' | 'timing' | 'inquiry';
  matched_spacecraft: AstroSpacecraft;
  match_score: number;
  interpretation: string;
  calculation_log: CalculationLog;
  created_at: string;
}

export interface CalculationLog {
  origin_match_score?: number; // 出生日期差值(天数)
  inquiry_match_score?: number; // 语义匹配度
  celestial_match_score?: number; // 当前日期差值(天数)
  keyword_matches?: string[];
  processing_time_ms?: number;
}

// 用户请求类型
export interface CalculationRequest {
  user_id?: string;
  birth_date: string; // YYYY-MM-DD
  inquiry?: string;
  calculation_type: 'origin' | 'timing' | 'inquiry';
}

// 错误响应类型
export interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

// 日期验证工具类型
export interface DateValidationResult {
  isValid: boolean;
  error?: string;
  formattedDate?: string;
}

// 关键词匹配结果
export interface KeywordMatch {
  keyword: string;
  score: number;
  spacecraft: AstroSpacecraft;
}

// 统一响应格式
export type ApiResponse<T> = {
  success: true;
  data: T;
  timestamp: string;
} | {
  success: false;
  error: string;
  details?: string;
  timestamp: string;
};