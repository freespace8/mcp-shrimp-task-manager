import { z } from "zod";
import { getAllTasks } from "../../models/taskModel.js";
import { TaskStatus } from "../../types/index.js";
import { getListTasksPrompt } from "../../prompts/index.js";

export const listTasksSchema = z.object({
  status: z
    .enum(["all", "pending", "in_progress", "completed"])
    .describe("要列出的任务状态，可选择 'all' 列出所有任务，或指定具体状态"),
});

// 列出任务工具
export async function listTasks({ status }: z.infer<typeof listTasksSchema>) {
  const tasks = await getAllTasks();
  let filteredTasks = tasks;
  switch (status) {
    case "all":
      break;
    case "pending":
      filteredTasks = tasks.filter(
        (task) => task.status === TaskStatus.PENDING
      );
      break;
    case "in_progress":
      filteredTasks = tasks.filter(
        (task) => task.status === TaskStatus.IN_PROGRESS
      );
      break;
    case "completed":
      filteredTasks = tasks.filter(
        (task) => task.status === TaskStatus.COMPLETED
      );
      break;
  }

  if (filteredTasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 系统通知\n\n目前系统中没有${
            status === "all" ? "任何" : `任何 ${status} 的`
          }任务。请查询其他状态任务或先使用「split_tasks」工具创建任务结构，再进行后续操作。`,
        },
      ],
    };
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // 使用prompt生成器获取最终prompt
  const prompt = getListTasksPrompt({
    status,
    tasks: tasksByStatus,
    allTasks: filteredTasks,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
