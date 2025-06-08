/**
 * planTask prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task, TaskDependency } from "../../types/index.js";

/**
 * planTask prompt 参数介面
 */
export interface PlanTaskPromptParams {
  description: string;
  requirements?: string;
  existingTasksReference?: boolean;
  completedTasks?: Task[];
  pendingTasks?: Task[];
  memoryDir: string;
}

/**
 * 获取 planTask 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getPlanTaskPrompt(params: PlanTaskPromptParams): string {
  let tasksContent = "";
  if (
    params.existingTasksReference &&
    params.completedTasks &&
    params.pendingTasks
  ) {
    const allTasks = [...params.completedTasks, ...params.pendingTasks];
    // 如果存在任务，则添加相关资讯
    if (allTasks.length > 0) {
      let completeTasksContent = "no completed tasks";

      // 处理已完成任务
      if (params.completedTasks.length > 0) {
        completeTasksContent = "";
        // 最多显示10个已完成任务，避免提示词过长
        const tasksToShow =
          params.completedTasks.length > 10
            ? params.completedTasks.slice(0, 10)
            : params.completedTasks;

        tasksToShow.forEach((task, index) => {
          // 产生完成时间资讯 (如果有)
          const completedTimeText = task.completedAt
            ? `   - completedAt：${task.completedAt.toLocaleString()}\n`
            : "";

          completeTasksContent += `{index}. **${task.name}** (ID: \`${
            task.id
          }\`)\n   - description：${
            task.description.length > 100
              ? task.description.substring(0, 100) + "..."
              : task.description
          }\n${completedTimeText}`;
          // 如果不是最后一个任务，添加换行
          if (index < tasksToShow.length - 1) {
            completeTasksContent += "\n\n";
          }
        });

        // 如果有更多任务，显示提示
        if (params.completedTasks.length > 10) {
          completeTasksContent += `\n\n*（仅显示前10个，共 ${params.completedTasks.length} 个）*\n`;
        }
      }

      let unfinishedTasksContent = "no pending tasks";
      // 处理未完成任务
      if (params.pendingTasks && params.pendingTasks.length > 0) {
        unfinishedTasksContent = "";

        params.pendingTasks.forEach((task, index) => {
          const dependenciesText =
            task.dependencies && task.dependencies.length > 0
              ? `   - dependence：${task.dependencies
                  .map((dep: TaskDependency) => `\`${dep.taskId}\``)
                  .join(", ")}\n`
              : "";

          unfinishedTasksContent += `${index + 1}. **${task.name}** (ID: \`${
            task.id
          }\`)\n   - description：${
            task.description.length > 150
              ? task.description.substring(0, 150) + "..."
              : task.description
          }\n   - status：${task.status}\n${dependenciesText}`;

          // 如果不是最后一个任务，添加换行
          if (index < (params.pendingTasks?.length ?? 0) - 1) {
            unfinishedTasksContent += "\n\n";
          }
        });
      }

      const tasksTemplate = loadPromptFromTemplate("planTask/tasks.md");
      tasksContent = generatePrompt(tasksTemplate, {
        completedTasks: completeTasksContent,
        unfinishedTasks: unfinishedTasksContent,
      });
    }
  }

  let thoughtTemplate = "";
  if (process.env.ENABLE_THOUGHT_CHAIN !== "false") {
    thoughtTemplate = loadPromptFromTemplate("planTask/hasThought.md");
  } else {
    thoughtTemplate = loadPromptFromTemplate("planTask/noThought.md");
  }
  const indexTemplate = loadPromptFromTemplate("planTask/index.md");
  let prompt = generatePrompt(indexTemplate, {
    description: params.description,
    requirements: params.requirements || "No requirements",
    tasksTemplate: tasksContent,
    rulesPath: "shrimp-rules.md",
    memoryDir: params.memoryDir,
    thoughtTemplate: thoughtTemplate,
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "PLAN_TASK");
}
