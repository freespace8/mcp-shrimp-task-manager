/**
 * updateTaskContent prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task, RelatedFile } from "../../types/index.js";

/**
 * updateTaskContent prompt 参数介面
 */
export interface UpdateTaskContentPromptParams {
  taskId: string;
  task?: Task;
  success?: boolean;
  message?: string;
  validationError?: string;
  emptyUpdate?: boolean;
  updatedTask?: Task;
}

/**
 * 获取 updateTaskContent 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getUpdateTaskContentPrompt(
  params: UpdateTaskContentPromptParams
): string {
  const {
    taskId,
    task,
    success,
    message,
    validationError,
    emptyUpdate,
    updatedTask,
  } = params;

  // 处理任务不存在的情况
  if (!task) {
    const notFoundTemplate = loadPromptFromTemplate(
      "updateTaskContent/notFound.md"
    );
    return generatePrompt(notFoundTemplate, {
      taskId,
    });
  }

  // 处理验证错误的情况
  if (validationError) {
    const validationTemplate = loadPromptFromTemplate(
      "updateTaskContent/validation.md"
    );
    return generatePrompt(validationTemplate, {
      error: validationError,
    });
  }

  // 处理空更新的情况
  if (emptyUpdate) {
    const emptyUpdateTemplate = loadPromptFromTemplate(
      "updateTaskContent/emptyUpdate.md"
    );
    return generatePrompt(emptyUpdateTemplate, {});
  }

  // 处理更新成功或失败的情况
  const responseTitle = success ? "Success" : "Failure";
  let content = message || "";

  // 更新成功且有更新后的任务详情
  if (success && updatedTask) {
    const successTemplate = loadPromptFromTemplate(
      "updateTaskContent/success.md"
    );

    // 编合相关文件信息
    let filesContent = "";
    if (updatedTask.relatedFiles && updatedTask.relatedFiles.length > 0) {
      const fileDetailsTemplate = loadPromptFromTemplate(
        "updateTaskContent/fileDetails.md"
      );

      // 按文件类型分组
      const filesByType = updatedTask.relatedFiles.reduce((acc, file) => {
        if (!acc[file.type]) {
          acc[file.type] = [];
        }
        acc[file.type].push(file);
        return acc;
      }, {} as Record<string, RelatedFile[]>);

      // 为每种文件类型生成内容
      for (const [type, files] of Object.entries(filesByType)) {
        const filesList = files.map((file) => `\`${file.path}\``).join(", ");
        filesContent += generatePrompt(fileDetailsTemplate, {
          fileType: type,
          fileCount: files.length,
          filesList,
        });
      }
    }

    // 处理任务备注
    const taskNotesPrefix = "- **Notes:** ";
    const taskNotes = updatedTask.notes
      ? `${taskNotesPrefix}${
          updatedTask.notes.length > 100
            ? `${updatedTask.notes.substring(0, 100)}...`
            : updatedTask.notes
        }\n`
      : "";

    // 生成成功更新的详细信息
    content += generatePrompt(successTemplate, {
      taskName: updatedTask.name,
      taskDescription:
        updatedTask.description.length > 100
          ? `${updatedTask.description.substring(0, 100)}...`
          : updatedTask.description,
      taskNotes: taskNotes,
      taskStatus: updatedTask.status,
      taskUpdatedAt: new Date(updatedTask.updatedAt).toISOString(),
      filesContent,
    });
  }

  const indexTemplate = loadPromptFromTemplate("updateTaskContent/index.md");
  const prompt = generatePrompt(indexTemplate, {
    responseTitle,
    message: content,
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "UPDATE_TASK_CONTENT");
}
