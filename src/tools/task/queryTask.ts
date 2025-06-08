import { z } from "zod";
import { searchTasksWithCommand } from "../../models/taskModel.js";
import { getQueryTaskPrompt } from "../../prompts/index.js";

// 查询任务工具
export const queryTaskSchema = z.object({
  query: z
    .string()
    .min(1, {
      message: "查询内容不能为空，请提供任务ID或搜寻关键字",
    })
    .describe("搜寻查询文字，可以是任务ID或多个关键字（空格分隔）"),
  isId: z
    .boolean()
    .optional()
    .default(false)
    .describe("指定是否为ID查询模式，默认为否（关键字模式）"),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .describe("分页页码，默认为第1页"),
  pageSize: z
    .number()
    .int()
    .positive()
    .min(1)
    .max(20)
    .optional()
    .default(5)
    .describe("每页显示的任务数量，默认为5笔，最大20笔"),
});

export async function queryTask({
  query,
  isId = false,
  page = 1,
  pageSize = 3,
}: z.infer<typeof queryTaskSchema>) {
  try {
    // 使用系统指令搜寻函数
    const results = await searchTasksWithCommand(query, isId, page, pageSize);

    // 使用prompt生成器获取最终prompt
    const prompt = getQueryTaskPrompt({
      query,
      isId,
      tasks: results.tasks,
      totalTasks: results.pagination.totalResults,
      page: results.pagination.currentPage,
      pageSize,
      totalPages: results.pagination.totalPages,
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
          text: `## 系统错误\n\n查询任务时发生错误: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}
