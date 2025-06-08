import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { getResearchModePrompt } from "../../prompts/index.js";

// 研究模式工具
export const researchModeSchema = z.object({
  topic: z
    .string()
    .min(5, {
      message: "研究主题不能少于5个字符，请提供明确的研究主题",
    })
    .describe("要研究的程式编程主题内容，应该明确且具体"),
  previousState: z
    .string()
    .optional()
    .default("")
    .describe(
      "之前的研究状态和内容摘要，第一次执行时为空，后续会包含之前详细且关键的研究成果，这将帮助后续的研究"
    ),
  currentState: z
    .string()
    .describe(
      "当前 Agent 主要该执行的内容，例如使用网路工具搜寻某些关键字或分析特定程式码，研究完毕后请呼叫 research_mode 来记录状态并与之前的`previousState`整合，这将帮助你更好的保存与执行研究内容"
    ),
  nextSteps: z
    .string()
    .describe(
      "后续的计划、步骤或研究方向，用来约束 Agent 不偏离主题或走错方向，如果研究过程中发现需要调整研究方向，请更新此栏位"
    ),
});

export async function researchMode({
  topic,
  previousState = "",
  currentState,
  nextSteps,
}: z.infer<typeof researchModeSchema>) {
  // 获取基础目录路径
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, "../../..");
  const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");
  const MEMORY_DIR = path.join(DATA_DIR, "memory");

  // 使用prompt生成器获取最终prompt
  const prompt = getResearchModePrompt({
    topic,
    previousState,
    currentState,
    nextSteps,
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
