/**
 * reflectTask prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";

/**
 * reflectTask prompt 参数介面
 */
export interface ReflectTaskPromptParams {
  summary: string;
  analysis: string;
}

/**
 * 获取 reflectTask 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getReflectTaskPrompt(params: ReflectTaskPromptParams): string {
  const indexTemplate = loadPromptFromTemplate("reflectTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    summary: params.summary,
    analysis: params.analysis,
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "REFLECT_TASK");
}
