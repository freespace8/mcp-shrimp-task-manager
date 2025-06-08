import { RelatedFile, RelatedFileType } from "../types/index.js";

/**
 * 生成任务相关文件的内容摘要
 *
 * 此函数根据提供的 RelatedFile 物件列表，生成文件的摘要信息，而不实际读取档案内容。
 * 这是一个轻量级的实现，仅基于档案元数据（如路径、类型、描述等）生成格式化的摘要，
 * 适用于需要提供文件上下文信息但不需要访问实际档案内容的情境。
 *
 * @param relatedFiles 相关文件列表 - RelatedFile 物件数组，包含文件的路径、类型、描述等资讯
 * @param maxTotalLength 摘要内容的最大总长度 - 控制生成摘要的总字符数，避免过大的返回内容
 * @returns 包含两个字段的物件：
 *   - content: 详细的文件资讯，包含每个档案的基本资讯和提示讯息
 *   - summary: 简洁的档案列表概览，适合快速浏览
 */
export async function loadTaskRelatedFiles(
  relatedFiles: RelatedFile[],
  maxTotalLength: number = 15000 // 控制生成内容的总长度
): Promise<{ content: string; summary: string }> {
  if (!relatedFiles || relatedFiles.length === 0) {
    return {
      content: "",
      summary: "无相关文件",
    };
  }

  let totalContent = "";
  let filesSummary = `## 相关文件内容摘要 (共 ${relatedFiles.length} 个文件)\n\n`;
  let totalLength = 0;

  // 按文件类型优先级排序（首先处理待修改的文件）
  const priorityOrder: Record<RelatedFileType, number> = {
    [RelatedFileType.TO_MODIFY]: 1,
    [RelatedFileType.REFERENCE]: 2,
    [RelatedFileType.DEPENDENCY]: 3,
    [RelatedFileType.CREATE]: 4,
    [RelatedFileType.OTHER]: 5,
  };

  const sortedFiles = [...relatedFiles].sort(
    (a, b) => priorityOrder[a.type] - priorityOrder[b.type]
  );

  // 处理每个文件
  for (const file of sortedFiles) {
    if (totalLength >= maxTotalLength) {
      filesSummary += `\n### 已达到上下文长度限制，部分文件未载入\n`;
      break;
    }

    // 生成文件基本资讯
    const fileInfo = generateFileInfo(file);

    // 添加到总内容
    const fileHeader = `\n### ${file.type}: ${file.path}${
      file.description ? ` - ${file.description}` : ""
    }${
      file.lineStart && file.lineEnd
        ? ` (行 ${file.lineStart}-${file.lineEnd})`
        : ""
    }\n\n`;

    totalContent += fileHeader + "```\n" + fileInfo + "\n```\n\n";
    filesSummary += `- **${file.path}**${
      file.description ? ` - ${file.description}` : ""
    } (${fileInfo.length} 字符)\n`;

    totalLength += fileInfo.length + fileHeader.length + 8; // 8 for "```\n" and "\n```"
  }

  return {
    content: totalContent,
    summary: filesSummary,
  };
}

/**
 * 生成文件基本资讯摘要
 *
 * 根据档案的元数据生成格式化的资讯摘要，包含档案路径、类型和相关提示。
 * 不读取实际档案内容，仅基于提供的 RelatedFile 物件生成信息。
 *
 * @param file 相关文件物件 - 包含档案路径、类型、描述等基本资讯
 * @returns 格式化的档案资讯摘要文字
 */
function generateFileInfo(file: RelatedFile): string {
  let fileInfo = `档案: ${file.path}\n`;
  fileInfo += `类型: ${file.type}\n`;

  if (file.description) {
    fileInfo += `描述: ${file.description}\n`;
  }

  if (file.lineStart && file.lineEnd) {
    fileInfo += `行范围: ${file.lineStart}-${file.lineEnd}\n`;
  }

  fileInfo += `若需查看实际内容，请直接查看档案: ${file.path}\n`;

  return fileInfo;
}
