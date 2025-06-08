// 任务状态枚举：定义任务在工作流程中的当前阶段
export enum TaskStatus {
  PENDING = "pending", // 已创建但尚未开始执行的任务
  IN_PROGRESS = "in_progress", // 当前正在执行的任务
  COMPLETED = "completed", // 已成功完成并通过验证的任务
  BLOCKED = "blocked", // 由于依赖关系而暂时无法执行的任务
}

// 任务依赖关系：定义任务之间的前置条件关系
export interface TaskDependency {
  taskId: string; // 前置任务的唯一标识符，当前任务执行前必须完成此依赖任务
}

// 相关文件类型：定义文件与任务的关系类型
export enum RelatedFileType {
  TO_MODIFY = "TO_MODIFY", // 需要在任务中修改的文件
  REFERENCE = "REFERENCE", // 任务的参考资料或相关文档
  CREATE = "CREATE", // 需要在任务中建立的文件
  DEPENDENCY = "DEPENDENCY", // 任务依赖的组件或库文件
  OTHER = "OTHER", // 其他类型的相关文件
}

// 相关文件：定义任务相关的文件信息
export interface RelatedFile {
  path: string; // 文件路径，可以是相对于项目根目录的路径或绝对路径
  type: RelatedFileType; // 文件与任务的关系类型
  description?: string; // 文件的补充描述，说明其与任务的具体关系或用途
  lineStart?: number; // 相关代码区块的起始行（选填）
  lineEnd?: number; // 相关代码区块的结束行（选填）
}

// 任务介面：定义任务的完整数据结构
export interface Task {
  id: string; // 任务的唯一标识符
  name: string; // 简洁明确的任务名称
  description: string; // 详细的任务描述，包含实施要点和验收标准
  notes?: string; // 补充说明、特殊处理要求或实施建议（选填）
  status: TaskStatus; // 任务当前的执行状态
  dependencies: TaskDependency[]; // 任务的前置依赖关系列表
  createdAt: Date; // 任务创建的时间戳
  updatedAt: Date; // 任务最后更新的时间戳
  completedAt?: Date; // 任务完成的时间戳（仅适用于已完成的任务）
  summary?: string; // 任务完成摘要，简洁描述实施结果和重要决策（仅适用于已完成的任务）
  relatedFiles?: RelatedFile[]; // 与任务相关的文件列表（选填）

  // 新增栏位：保存完整的技术分析结果
  analysisResult?: string; // 来自 analyze_task 和 reflect_task 阶段的完整分析结果

  // 新增栏位：保存具体的实现指南
  implementationGuide?: string; // 具体的实现方法、步骤和建议

  // 新增栏位：保存验证标准和检验方法
  verificationCriteria?: string; // 明确的验证标准、测试要点和验收条件
}

// 任务复杂度级别：定义任务的复杂程度分类
export enum TaskComplexityLevel {
  LOW = "低复杂度", // 简单且直接的任务，通常不需要特殊处理
  MEDIUM = "中等复杂度", // 具有一定复杂性但仍可管理的任务
  HIGH = "高复杂度", // 复杂且耗时的任务，需要特别关注
  VERY_HIGH = "极高复杂度", // 极其复杂的任务，建议拆分处理
}

// 任务复杂度阈值：定义任务复杂度评估的参考标准
export const TaskComplexityThresholds = {
  DESCRIPTION_LENGTH: {
    MEDIUM: 500, // 超过此字数判定为中等复杂度
    HIGH: 1000, // 超过此字数判定为高复杂度
    VERY_HIGH: 2000, // 超过此字数判定为极高复杂度
  },
  DEPENDENCIES_COUNT: {
    MEDIUM: 2, // 超过此依赖数量判定为中等复杂度
    HIGH: 5, // 超过此依赖数量判定为高复杂度
    VERY_HIGH: 10, // 超过此依赖数量判定为极高复杂度
  },
  NOTES_LENGTH: {
    MEDIUM: 200, // 超过此字数判定为中等复杂度
    HIGH: 500, // 超过此字数判定为高复杂度
    VERY_HIGH: 1000, // 超过此字数判定为极高复杂度
  },
};

// 任务复杂度评估结果：记录任务复杂度分析的详细结果
export interface TaskComplexityAssessment {
  level: TaskComplexityLevel; // 整体复杂度级别
  metrics: {
    // 各项评估指标的详细数据
    descriptionLength: number; // 描述长度
    dependenciesCount: number; // 依赖数量
    notesLength: number; // 注记长度
    hasNotes: boolean; // 是否有注记
  };
  recommendations: string[]; // 处理建议列表
}
