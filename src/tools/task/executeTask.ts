import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskStatus,
  canExecuteTask,
  assessTaskComplexity,
} from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { getExecuteTaskPrompt } from "../../prompts/index.js";
import { loadTaskRelatedFiles } from "../../utils/fileLoader.js";

// 执行任务工具
export const executeTaskSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "任务ID格式无效，请提供有效的UUID v4格式",
    })
    .describe("待执行任务的唯一标识符，必须是系统中存在的有效任务ID"),
});

export async function executeTask({
  taskId,
}: z.infer<typeof executeTaskSchema>) {
  try {
    // 检查任务是否存在
    const task = await getTaskById(taskId);
    if (!task) {
      return {
        content: [
          {
            type: "text" as const,
            text: `找不到ID为 \`${taskId}\` 的任务。请确认ID是否正确。`,
          },
        ],
      };
    }

    // 检查任务是否可以执行（依赖任务都已完成）
    const executionCheck = await canExecuteTask(taskId);
    if (!executionCheck.canExecute) {
      const blockedByTasksText =
        executionCheck.blockedBy && executionCheck.blockedBy.length > 0
          ? `被以下未完成的依赖任务阻挡: ${executionCheck.blockedBy.join(", ")}`
          : "无法确定阻挡原因";

      return {
        content: [
          {
            type: "text" as const,
            text: `任务 "${task.name}" (ID: \`${taskId}\`) 目前无法执行。${blockedByTasksText}`,
          },
        ],
      };
    }

    // 如果任务已经标记为「进行中」，提示用户
    if (task.status === TaskStatus.IN_PROGRESS) {
      return {
        content: [
          {
            type: "text" as const,
            text: `任务 "${task.name}" (ID: \`${taskId}\`) 已经处于进行中状态。`,
          },
        ],
      };
    }

    // 如果任务已经标记为「已完成」，提示用户
    if (task.status === TaskStatus.COMPLETED) {
      return {
        content: [
          {
            type: "text" as const,
            text: `任务 "${task.name}" (ID: \`${taskId}\`) 已经标记为完成。如需重新执行，请先使用 delete_task 删除该任务并重新创建。`,
          },
        ],
      };
    }

    // 更新任务状态为「进行中」
    await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);

    // 评估任务复杂度
    const complexityResult = await assessTaskComplexity(taskId);

    // 将复杂度结果转换为适当的格式
    const complexityAssessment = complexityResult
      ? {
          level: complexityResult.level,
          metrics: {
            descriptionLength: complexityResult.metrics.descriptionLength,
            dependenciesCount: complexityResult.metrics.dependenciesCount,
          },
          recommendations: complexityResult.recommendations,
        }
      : undefined;

    // 获取依赖任务，用于显示完成摘要
    const dependencyTasks: Task[] = [];
    if (task.dependencies && task.dependencies.length > 0) {
      for (const dep of task.dependencies) {
        const depTask = await getTaskById(dep.taskId);
        if (depTask) {
          dependencyTasks.push(depTask);
        }
      }
    }

    // 加载任务相关的文件内容
    let relatedFilesSummary = "";
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      try {
        const relatedFilesResult = await loadTaskRelatedFiles(
          task.relatedFiles
        );
        relatedFilesSummary =
          typeof relatedFilesResult === "string"
            ? relatedFilesResult
            : relatedFilesResult.summary || "";
      } catch (error) {
        relatedFilesSummary =
          "Error loading related files, please check the files manually.";
      }
    }

    // 使用prompt生成器获取最终prompt
    const prompt = getExecuteTaskPrompt({
      task,
      complexityAssessment,
      relatedFilesSummary,
      dependencyTasks,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: prompt,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `执行任务时发生错误: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
}
