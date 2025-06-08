/**
 * getTaskDetail prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * getTaskDetail prompt 参数介面
 */
export interface GetTaskDetailPromptParams {
  taskId: string;
  task?: Task | null;
  error?: string;
}

/**
 * 获取 getTaskDetail 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getGetTaskDetailPrompt(
  params: GetTaskDetailPromptParams
): string {
  const { taskId, task, error } = params;

  // 如果有错误，显示错误讯息
  if (error) {
    const errorTemplate = loadPromptFromTemplate("getTaskDetail/error.md");
    return generatePrompt(errorTemplate, {
      errorMessage: error,
    });
  }

  // 如果找不到任务，显示找不到任务的讯息
  if (!task) {
    const notFoundTemplate = loadPromptFromTemplate(
      "getTaskDetail/notFound.md"
    );
    return generatePrompt(notFoundTemplate, {
      taskId,
    });
  }

  let notesPrompt = "";
  if (task.notes) {
    const notesTemplate = loadPromptFromTemplate("getTaskDetail/notes.md");
    notesPrompt = generatePrompt(notesTemplate, {
      notes: task.notes,
    });
  }

  let dependenciesPrompt = "";
  if (task.dependencies && task.dependencies.length > 0) {
    const dependenciesTemplate = loadPromptFromTemplate(
      "getTaskDetail/dependencies.md"
    );
    dependenciesPrompt = generatePrompt(dependenciesTemplate, {
      dependencies: task.dependencies
        .map((dep) => `\`${dep.taskId}\``)
        .join(", "),
    });
  }

  let implementationGuidePrompt = "";
  if (task.implementationGuide) {
    const implementationGuideTemplate = loadPromptFromTemplate(
      "getTaskDetail/implementationGuide.md"
    );
    implementationGuidePrompt = generatePrompt(implementationGuideTemplate, {
      implementationGuide: task.implementationGuide,
    });
  }

  let verificationCriteriaPrompt = "";
  if (task.verificationCriteria) {
    const verificationCriteriaTemplate = loadPromptFromTemplate(
      "getTaskDetail/verificationCriteria.md"
    );
    verificationCriteriaPrompt = generatePrompt(verificationCriteriaTemplate, {
      verificationCriteria: task.verificationCriteria,
    });
  }

  let relatedFilesPrompt = "";
  if (task.relatedFiles && task.relatedFiles.length > 0) {
    const relatedFilesTemplate = loadPromptFromTemplate(
      "getTaskDetail/relatedFiles.md"
    );
    relatedFilesPrompt = generatePrompt(relatedFilesTemplate, {
      files: task.relatedFiles
        .map(
          (file) =>
            `- \`${file.path}\` (${file.type})${
              file.description ? `: ${file.description}` : ""
            }`
        )
        .join("\n"),
    });
  }

  let complatedSummaryPrompt = "";
  if (task.completedAt) {
    const complatedSummaryTemplate = loadPromptFromTemplate(
      "getTaskDetail/complatedSummary.md"
    );
    complatedSummaryPrompt = generatePrompt(complatedSummaryTemplate, {
      completedTime: new Date(task.completedAt).toLocaleString("zh-TW"),
      summary: task.summary || "*无完成摘要*",
    });
  }

  const indexTemplate = loadPromptFromTemplate("getTaskDetail/index.md");

  // 开始构建基本 prompt
  let prompt = generatePrompt(indexTemplate, {
    name: task.name,
    id: task.id,
    status: task.status,
    description: task.description,
    notesTemplate: notesPrompt,
    dependenciesTemplate: dependenciesPrompt,
    implementationGuideTemplate: implementationGuidePrompt,
    verificationCriteriaTemplate: verificationCriteriaPrompt,
    relatedFilesTemplate: relatedFilesPrompt,
    createdTime: new Date(task.createdAt).toLocaleString("zh-TW"),
    updatedTime: new Date(task.updatedAt).toLocaleString("zh-TW"),
    complatedSummaryTemplate: complatedSummaryPrompt,
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "GET_TASK_DETAIL");
}
