/**
 * verifyTask prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * verifyTask prompt 参数介面
 */
export interface VerifyTaskPromptParams {
  task: Task;
  score: number;
  summary: string;
}

/**
 * 提取摘要内容
 * @param content 原始内容
 * @param maxLength 最大长度
 * @returns 提取的摘要
 */
function extractSummary(
  content: string | undefined,
  maxLength: number
): string {
  if (!content) return "";

  if (content.length <= maxLength) {
    return content;
  }

  // 简单的摘要提取：截取前 maxLength 个字符并添加省略号
  return content.substring(0, maxLength) + "...";
}

/**
 * 获取 verifyTask 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getVerifyTaskPrompt(params: VerifyTaskPromptParams): string {
  const { task, score, summary } = params;
  if (score < 80) {
    const noPassTemplate = loadPromptFromTemplate("verifyTask/noPass.md");
    const prompt = generatePrompt(noPassTemplate, {
      name: task.name,
      id: task.id,
      summary,
    });
    return prompt;
  }
  const indexTemplate = loadPromptFromTemplate("verifyTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    name: task.name,
    id: task.id,
    description: task.description,
    notes: task.notes || "no notes",
    verificationCriteria:
      task.verificationCriteria || "no verification criteria",
    implementationGuideSummary:
      extractSummary(task.implementationGuide, 200) ||
      "no implementation guide",
    analysisResult:
      extractSummary(task.analysisResult, 300) || "no analysis result",
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "VERIFY_TASK");
}
