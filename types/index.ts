export type Language = 'en' | 'nl';
export type ColumnType = 'date' | 'number' | 'category' | 'boolean' | 'text';

export interface ParsedColumn {
  name: string;
  originalName: string;
  sqlType: string;
  inferredType: ColumnType;
  nullable: boolean;
  uniqueCount: number;
  sampleValues: string[];
}

export interface ParsedTable {
  name: string;
  rowCount: number;
  columns: ParsedColumn[];
  data: Record<string, any>[];
}

export interface DatabaseInfo {
  fileName: string;
  fileType: 'sqlite' | 'csv';
  fileSize: number;
  tables: ParsedTable[];
  uploadedAt: string;
}

export interface MetricCard {
  key: string;
  titleEn: string;
  titleNl: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  titleEn: string;
  titleNl: string;
  data: Record<string, any>[];
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
}

export interface ChatbotColumns {
  date?: string;
  status?: string;
  reason?: string;
  agent?: string;
  channel?: string;
  duration?: string;
  customer?: string;
  handover?: string;
  resolved?: string;
}

export interface AnalyticsResult {
  metrics: MetricCard[];
  charts: ChartConfig[];
  isChatbotData: boolean;
  chatbotColumns: ChatbotColumns;
}
