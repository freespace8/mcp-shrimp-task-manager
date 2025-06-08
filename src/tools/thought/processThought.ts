import { z } from "zod";
import {
  getProcessThoughtPrompt,
  ProcessThoughtPromptParams,
} from "../../prompts/generators/processThought.js";

/**
 * processThought工具的参数结构
 */
export const processThoughtSchema = z.object({
  thought: z
    .string()
    .min(1, {
      message: "思维内容不能为空，请提供有效的思考内容",
    })
    .describe("思维内容"),
  thought_number: z
    .number()
    .int()
    .positive({
      message: "思维编号必须是正整数",
    })
    .describe("当前思维编号"),
  total_thoughts: z
    .number()
    .int()
    .positive({
      message: "总思维数必须是正整数",
    })
    .describe("预计总思维数量，如果需要更多的思考可以随时变更"),
  next_thought_needed: z.boolean().describe("是否需要下一步思维"),
  stage: z
    .string()
    .min(1, {
      message: "思维阶段不能为空，请提供有效的思考阶段",
    })
    .describe(
      "Thinking stage. Available stages include: Problem Definition, Information Gathering, Research, Analysis, Synthesis, Conclusion, Critical Questioning, and Planning."
    ),
  tags: z.array(z.string()).optional().describe("思维标签，是一个阵列字串"),
  axioms_used: z
    .array(z.string())
    .optional()
    .describe("使用的公理，是一个阵列字串"),
  assumptions_challenged: z
    .array(z.string())
    .optional()
    .describe("挑战的假设，是一个阵列字串"),
});

/**
 * 处理单一思维并返回格式化输出
 */
export async function processThought(
  params: z.infer<typeof processThoughtSchema>
) {
  try {
    // 将参数转换为规范的ThoughtData格式
    const thoughtData: ProcessThoughtPromptParams = {
      thought: params.thought,
      thoughtNumber: params.thought_number,
      totalThoughts: params.total_thoughts,
      nextThoughtNeeded: params.next_thought_needed,
      stage: params.stage,
      tags: params.tags || [],
      axioms_used: params.axioms_used || [],
      assumptions_challenged: params.assumptions_challenged || [],
    };

    // 确保思维编号不超过总思维数
    if (thoughtData.thoughtNumber > thoughtData.totalThoughts) {
      // 自动调整总思维数量
      thoughtData.totalThoughts = thoughtData.thoughtNumber;
    }

    // 格式化思维输出
    const formattedThought = getProcessThoughtPrompt(thoughtData);

    // 返回成功响应
    return {
      content: [
        {
          type: "text" as const,
          text: formattedThought,
        },
      ],
    };
  } catch (error) {
    // 捕获并处理所有未预期的错误
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return {
      content: [
        {
          type: "text" as const,
          text: `处理思维时发生错误: ${errorMessage}`,
        },
      ],
    };
  }
}
