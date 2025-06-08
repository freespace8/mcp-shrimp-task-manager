/**
 * initProjectRules prompt 生成器
 * 负责将模板和参数组合成最终的 prompt
 */

import { loadPrompt, loadPromptFromTemplate } from "../loader.js";
/**
 * initProjectRules prompt 参数介面
 */
export interface InitProjectRulesPromptParams {
  // 目前没有额外参数，未来可按需扩展
}

/**
 * 获取 initProjectRules 的完整 prompt
 * @param params prompt 参数（可选）
 * @returns 生成的 prompt
 */
export function getInitProjectRulesPrompt(
  params?: InitProjectRulesPromptParams
): string {
  const indexTemplate = loadPromptFromTemplate("initProjectRules/index.md");

  // 载入可能的自定义 prompt (通过环境变数覆盖或追加)
  return loadPrompt(indexTemplate, "INIT_PROJECT_RULES");
}
