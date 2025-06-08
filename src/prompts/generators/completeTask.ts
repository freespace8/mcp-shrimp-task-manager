/**
 * completeTask prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * completeTask prompt 参数介面
 */
export interface CompleteTaskPromptParams {
  task: Task;
  completionTime: string;
}

/**
 * 获取 completeTask 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getCompleteTaskPrompt(
  params: CompleteTaskPromptParams
): string {
  const { task, completionTime } = params;

  const indexTemplate = loadPromptFromTemplate("completeTask/index.md");

  // 开始构建基本 prompt
  let prompt = generatePrompt(indexTemplate, {
    name: task.name,
    id: task.id,
    completionTime: completionTime,
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "COMPLETE_TASK");
}
