/**
 * prompt 载入器
 * 提供从环境变数载入自定义 prompt 的功能
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processEnvString(input: string | undefined): string {
  if (!input) return "";

  return input
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

/**
 * 载入 prompt，支援环境变数自定义
 * @param basePrompt 基本 prompt 内容
 * @param promptKey prompt 的键名，用于生成环境变数名称
 * @returns 最终的 prompt 内容
 */
export function loadPrompt(basePrompt: string, promptKey: string): string {
  // 转换为大写，作为环境变数的一部分
  const envKey = promptKey.toUpperCase();

  // 检查是否有替换模式的环境变数
  const overrideEnvVar = `MCP_PROMPT_${envKey}`;
  if (process.env[overrideEnvVar]) {
    // 使用环境变数完全替换原始 prompt
    return processEnvString(process.env[overrideEnvVar]);
  }

  // 检查是否有追加模式的环境变数
  const appendEnvVar = `MCP_PROMPT_${envKey}_APPEND`;
  if (process.env[appendEnvVar]) {
    // 将环境变数内容追加到原始 prompt 后
    return `${basePrompt}\n\n${processEnvString(process.env[appendEnvVar])}`;
  }

  // 如果没有自定义，则使用原始 prompt
  return basePrompt;
}

/**
 * 生成包含动态参数的 prompt
 * @param promptTemplate prompt 模板
 * @param params 动态参数
 * @returns 填充参数后的 prompt
 */
export function generatePrompt(
  promptTemplate: string,
  params: Record<string, any> = {}
): string {
  // 使用简单的模板替换方法，将 {paramName} 替换为对应的参数值
  let result = promptTemplate;

  Object.entries(params).forEach(([key, value]) => {
    // 如果值为 undefined 或 null，使用空字串替换
    const replacementValue =
      value !== undefined && value !== null ? String(value) : "";

    // 使用正则表达式替换所有匹配的占位符
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(placeholder, replacementValue);
  });

  return result;
}

/**
 * 从模板载入 prompt
 * @param templatePath 相对于模板集根目录的模板路径 (e.g., 'chat/basic.md')
 * @returns 模板内容
 * @throws Error 如果找不到模板文件
 */
export function loadPromptFromTemplate(templatePath: string): string {
  const templateSetName = process.env.TEMPLATES_USE || "en";
  const dataDir = process.env.DATA_DIR;
  const builtInTemplatesBaseDir = __dirname;

  let finalPath = "";
  const checkedPaths: string[] = []; // 用于更详细的错误报告

  // 1. 检查 DATA_DIR 中的自定义路径
  if (dataDir) {
    // path.resolve 可以处理 templateSetName 是绝对路径的情况
    const customFilePath = path.resolve(dataDir, templateSetName, templatePath);
    checkedPaths.push(`Custom: ${customFilePath}`);
    if (fs.existsSync(customFilePath)) {
      finalPath = customFilePath;
    }
  }

  // 2. 如果未找到自定义路径，检查特定的内建模板目录
  if (!finalPath) {
    // 假设 templateSetName 对于内建模板是 'en', 'zh' 等
    const specificBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      `templates_${templateSetName}`,
      templatePath
    );
    checkedPaths.push(`Specific Built-in: ${specificBuiltInFilePath}`);
    if (fs.existsSync(specificBuiltInFilePath)) {
      finalPath = specificBuiltInFilePath;
    }
  }

  // 3. 如果特定的内建模板也未找到，且不是 'en' (避免重复检查)
  if (!finalPath && templateSetName !== "en") {
    const defaultBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      "templates_en",
      templatePath
    );
    checkedPaths.push(`Default Built-in ('en'): ${defaultBuiltInFilePath}`);
    if (fs.existsSync(defaultBuiltInFilePath)) {
      finalPath = defaultBuiltInFilePath;
    }
  }

  // 4. 如果所有路径都找不到模板，抛出错误
  if (!finalPath) {
    throw new Error(
      `Template file not found: '${templatePath}' in template set '${templateSetName}'. Checked paths:\n - ${checkedPaths.join(
        "\n - "
      )}`
    );
  }

  // 5. 读取找到的文件
  return fs.readFileSync(finalPath, "utf-8");
}
