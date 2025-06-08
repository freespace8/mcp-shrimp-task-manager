import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { getAllTasks } from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { getPlanTaskPrompt } from "../../prompts/index.js";

// 开始规划工具
export const planTaskSchema = z.object({
  description: z
    .string()
    .min(10, {
      message: "任务描述不能少于10个字符，请提供更详细的描述以确保任务目标明确",
    })
    .describe("完整详细的任务问题描述，应包含任务目标、背景及预期成果"),
  requirements: z
    .string()
    .optional()
    .describe("任务的特定技术要求、业务约束条件或品质标准（选填）"),
  existingTasksReference: z
    .boolean()
    .optional()
    .default(false)
    .describe("是否参考现有任务作为规划基础，用于任务调整和延续性规划"),
});

export async function planTask({
  description,
  requirements,
  existingTasksReference = false,
}: z.infer<typeof planTaskSchema>) {
  // 获取基础目录路径
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, "../../..");
  const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");
  const MEMORY_DIR = path.join(DATA_DIR, "memory");

  // 准备所需参数
  let completedTasks: Task[] = [];
  let pendingTasks: Task[] = [];

  // 当 existingTasksReference 为 true 时，从数据库中载入所有任务作为参考
  if (existingTasksReference) {
    try {
      const allTasks = await getAllTasks();

      // 将任务分为已完成和未完成两类
      completedTasks = allTasks.filter(
        (task) => task.status === TaskStatus.COMPLETED
      );
      pendingTasks = allTasks.filter(
        (task) => task.status !== TaskStatus.COMPLETED
      );
    } catch (error) {}
  }

  // 使用prompt生成器获取最终prompt
  const prompt = getPlanTaskPrompt({
    description,
    requirements,
    existingTasksReference,
    completedTasks,
    pendingTasks,
    memoryDir: MEMORY_DIR,
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
