import { z } from "zod";
import { getInitProjectRulesPrompt } from "../../prompts/index.js";

// 定义schema
export const initProjectRulesSchema = z.object({});

/**
 * 初始化专案规范工具函数
 * 提供建立规范文件的指导
 */
export async function initProjectRules() {
  try {
    // 从生成器获取提示词
    const promptContent = getInitProjectRulesPrompt();

    // 返回成功响应
    return {
      content: [
        {
          type: "text" as const,
          text: promptContent,
        },
      ],
    };
  } catch (error) {
    // 错误处理
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return {
      content: [
        {
          type: "text" as const,
          text: `初始化专案规范时发生错误: ${errorMessage}`,
        },
      ],
    };
  }
}
