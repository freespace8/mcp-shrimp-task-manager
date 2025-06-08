/**
 * researchMode prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";

/**
 * researchMode prompt 参数介面
 */
export interface ResearchModePromptParams {
  topic: string;
  previousState: string;
  currentState: string;
  nextSteps: string;
  memoryDir: string;
}

/**
 * 获取 researchMode 的完整 prompt
 * @param params prompt 参数
 * @returns 生成的 prompt
 */
export function getResearchModePrompt(
  params: ResearchModePromptParams
): string {
  // 处理之前的研究状态
  let previousStateContent = "";
  if (params.previousState && params.previousState.trim() !== "") {
    const previousStateTemplate = loadPromptFromTemplate(
      "researchMode/previousState.md"
    );
    previousStateContent = generatePrompt(previousStateTemplate, {
      previousState: params.previousState,
    });
  } else {
    previousStateContent = "这是第一次进行此主题的研究，没有之前的研究状态。";
  }

  // 载入主要模板
  const indexTemplate = loadPromptFromTemplate("researchMode/index.md");
  let prompt = generatePrompt(indexTemplate, {
    topic: params.topic,
    previousStateContent: previousStateContent,
    currentState: params.currentState,
    nextSteps: params.nextSteps,
    memoryDir: params.memoryDir,
    time: new Date().toLocaleString(),
  });

  // 载入可能的自定义 prompt
  return loadPrompt(prompt, "RESEARCH_MODE");
}
