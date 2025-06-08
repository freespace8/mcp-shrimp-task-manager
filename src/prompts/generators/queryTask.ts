/**
 * queryTask prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * queryTask prompt 参数介面
 */
export interface QueryTaskPromptParams {
  query: string;
  isId: boolean;
  tasks: Task[];
  totalTasks: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 获取 queryTask 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getQueryTaskPrompt(params: QueryTaskPromptParams): string {
  const { query, isId, tasks, totalTasks, page, pageSize, totalPages } = params;

  if (tasks.length === 0) {
    const notFoundTemplate = loadPromptFromTemplate("queryTask/notFound.md");
    return generatePrompt(notFoundTemplate, {
      query,
    });
  }

  const taskDetailsTemplate = loadPromptFromTemplate(
    "queryTask/taskDetails.md"
  );
  let tasksContent = "";
  for (const task of tasks) {
    tasksContent += generatePrompt(taskDetailsTemplate, {
      taskId: task.id,
      taskName: task.name,
      taskStatus: task.status,
      taskDescription:
        task.description.length > 100
          ? `${task.description.substring(0, 100)}...`
          : task.description,
      createdAt: new Date(task.createdAt).toLocaleString(),
    });
  }

  const indexTemplate = loadPromptFromTemplate("queryTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    tasksContent,
    page,
    totalPages,
    pageSize,
    totalTasks,
    query,
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "QUERY_TASK");
}
