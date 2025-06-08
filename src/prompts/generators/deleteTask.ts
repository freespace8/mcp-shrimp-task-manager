/**
 * deleteTask prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * deleteTask prompt 参数介面
 */
export interface DeleteTaskPromptParams {
  taskId: string;
  task?: Task;
  success?: boolean;
  message?: string;
  isTaskCompleted?: boolean;
}

/**
 * 获取 deleteTask 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getDeleteTaskPrompt(params: DeleteTaskPromptParams): string {
  const { taskId, task, success, message, isTaskCompleted } = params;

  // 处理任务不存在的情况
  if (!task) {
    const notFoundTemplate = loadPromptFromTemplate("deleteTask/notFound.md");
    return generatePrompt(notFoundTemplate, {
      taskId,
    });
  }

  // 处理任务已完成的情况
  if (isTaskCompleted) {
    const completedTemplate = loadPromptFromTemplate("deleteTask/completed.md");
    return generatePrompt(completedTemplate, {
      taskId: task.id,
      taskName: task.name,
    });
  }

  // 处理删除成功或失败的情况
  const responseTitle = success ? "Success" : "Failure";
  const indexTemplate = loadPromptFromTemplate("deleteTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    responseTitle,
    message,
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "DELETE_TASK");
}
