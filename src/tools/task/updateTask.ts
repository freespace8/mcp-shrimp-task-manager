import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskContent as modelUpdateTaskContent,
} from "../../models/taskModel.js";
import { RelatedFileType } from "../../types/index.js";
import { getUpdateTaskContentPrompt } from "../../prompts/index.js";

// 更新任务内容工具
export const updateTaskContentSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "任务ID格式无效，请提供有效的UUID v4格式",
    })
    .describe("待更新任务的唯一标识符，必须是系统中存在且未完成的任务ID"),
  name: z.string().optional().describe("任务的新名称（选填）"),
  description: z.string().optional().describe("任务的新描述内容（选填）"),
  notes: z.string().optional().describe("任务的新补充说明（选填）"),
  dependencies: z
    .array(z.string())
    .optional()
    .describe("任务的新依赖关系（选填）"),
  relatedFiles: z
    .array(
      z.object({
        path: z
          .string()
          .min(1, { message: "文件路径不能为空，请提供有效的文件路径" })
          .describe("文件路径，可以是相对于项目根目录的路径或绝对路径"),
        type: z
          .nativeEnum(RelatedFileType)
          .describe(
            "文件与任务的关系类型 (TO_MODIFY, REFERENCE, CREATE, DEPENDENCY, OTHER)"
          ),
        description: z.string().optional().describe("文件的补充描述（选填）"),
        lineStart: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("相关代码区块的起始行（选填）"),
        lineEnd: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("相关代码区块的结束行（选填）"),
      })
    )
    .optional()
    .describe(
      "与任务相关的文件列表，用于记录与任务相关的代码文件、参考资料、要建立的档案等（选填）"
    ),
  implementationGuide: z
    .string()
    .optional()
    .describe("任务的新实现指南（选填）"),
  verificationCriteria: z
    .string()
    .optional()
    .describe("任务的新验证标准（选填）"),
});

export async function updateTaskContent({
  taskId,
  name,
  description,
  notes,
  relatedFiles,
  dependencies,
  implementationGuide,
  verificationCriteria,
}: z.infer<typeof updateTaskContentSchema>) {
  if (relatedFiles) {
    for (const file of relatedFiles) {
      if (
        (file.lineStart && !file.lineEnd) ||
        (!file.lineStart && file.lineEnd) ||
        (file.lineStart && file.lineEnd && file.lineStart > file.lineEnd)
      ) {
        return {
          content: [
            {
              type: "text" as const,
              text: getUpdateTaskContentPrompt({
                taskId,
                validationError:
                  "行号设置无效：必须同时设置起始行和结束行，且起始行必须小于结束行",
              }),
            },
          ],
        };
      }
    }
  }

  if (
    !(
      name ||
      description ||
      notes ||
      dependencies ||
      implementationGuide ||
      verificationCriteria ||
      relatedFiles
    )
  ) {
    return {
      content: [
        {
          type: "text" as const,
          text: getUpdateTaskContentPrompt({
            taskId,
            emptyUpdate: true,
          }),
        },
      ],
    };
  }

  // 获取任务以检查它是否存在
  const task = await getTaskById(taskId);

  if (!task) {
    return {
      content: [
        {
          type: "text" as const,
          text: getUpdateTaskContentPrompt({
            taskId,
          }),
        },
      ],
      isError: true,
    };
  }

  // 记录要更新的任务和内容
  let updateSummary = `准备更新任务：${task.name} (ID: ${task.id})`;
  if (name) updateSummary += `，新名称：${name}`;
  if (description) updateSummary += `，更新描述`;
  if (notes) updateSummary += `，更新注记`;
  if (relatedFiles)
    updateSummary += `，更新相关文件 (${relatedFiles.length} 个)`;
  if (dependencies)
    updateSummary += `，更新依赖关系 (${dependencies.length} 个)`;
  if (implementationGuide) updateSummary += `，更新实现指南`;
  if (verificationCriteria) updateSummary += `，更新验证标准`;

  // 执行更新操作
  const result = await modelUpdateTaskContent(taskId, {
    name,
    description,
    notes,
    relatedFiles,
    dependencies,
    implementationGuide,
    verificationCriteria,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: getUpdateTaskContentPrompt({
          taskId,
          task,
          success: result.success,
          message: result.message,
          updatedTask: result.task,
        }),
      },
    ],
    isError: !result.success,
  };
}
