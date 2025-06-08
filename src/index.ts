import "dotenv/config";
import { loadPromptFromTemplate } from "./prompts/loader.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response, NextFunction } from "express";
import getPort from "get-port";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";

// 导入所有工具函数和 schema
import {
  planTask,
  planTaskSchema,
  analyzeTask,
  analyzeTaskSchema,
  reflectTask,
  reflectTaskSchema,
  splitTasks,
  splitTasksSchema,
  splitTasksRaw,
  splitTasksRawSchema,
  listTasksSchema,
  listTasks,
  executeTask,
  executeTaskSchema,
  verifyTask,
  verifyTaskSchema,
  deleteTask,
  deleteTaskSchema,
  clearAllTasks,
  clearAllTasksSchema,
  updateTaskContent,
  updateTaskContentSchema,
  queryTask,
  queryTaskSchema,
  getTaskDetail,
  getTaskDetailSchema,
  processThought,
  processThoughtSchema,
  initProjectRules,
  initProjectRulesSchema,
  researchMode,
  researchModeSchema,
} from "./tools/index.js";

async function main() {
  try {
    const ENABLE_GUI = process.env.ENABLE_GUI === "true";

    if (ENABLE_GUI) {
      // 创建 Express 应用
      const app = express();

      // 储存 SSE 客户端的列表
      let sseClients: Response[] = [];

      // 发送 SSE 事件的辅助函数
      function sendSseUpdate() {
        sseClients.forEach((client) => {
          // 检查客户端是否仍然连接
          if (!client.writableEnded) {
            client.write(
              `event: update\ndata: ${JSON.stringify({
                timestamp: Date.now(),
              })}\n\n`
            );
          }
        });
        // 清理已断开的客户端 (可选，但建议)
        sseClients = sseClients.filter((client) => !client.writableEnded);
      }

      // 设置静态文件目录
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const publicPath = path.join(__dirname, "public");
      const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
      const TASKS_FILE_PATH = path.join(DATA_DIR, "tasks.json"); // 提取档案路径

      app.use(express.static(publicPath));

      // 设置 API 路由
      app.get("/api/tasks", async (req: Request, res: Response) => {
        try {
          // 使用 fsPromises 保持异步读取
          const tasksData = await fsPromises.readFile(TASKS_FILE_PATH, "utf-8");
          res.json(JSON.parse(tasksData));
        } catch (error) {
          // 确保档案不存在时返回空任务列表
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            res.json({ tasks: [] });
          } else {
            res.status(500).json({ error: "Failed to read tasks data" });
          }
        }
      });

      // 新增：SSE 端点
      app.get("/api/tasks/stream", (req: Request, res: Response) => {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          // 可选: CORS 头，如果前端和后端不在同一个 origin
          // "Access-Control-Allow-Origin": "*",
        });

        // 发送一个初始事件或保持连接
        res.write("data: connected\n\n");

        // 将客户端添加到列表
        sseClients.push(res);

        // 当客户端断开连接时，将其从列表中移除
        req.on("close", () => {
          sseClients = sseClients.filter((client) => client !== res);
        });
      });

      // 获取可用埠
      const port = await getPort();

      // 启动 HTTP 伺服器
      const httpServer = app.listen(port, () => {
        // 在伺服器启动后开始监听档案变化
        try {
          // 检查档案是否存在，如果不存在则不监听 (避免 watch 报错)
          if (fs.existsSync(TASKS_FILE_PATH)) {
            fs.watch(TASKS_FILE_PATH, (eventType, filename) => {
              if (
                filename &&
                (eventType === "change" || eventType === "rename")
              ) {
                // 稍微延迟发送，以防短时间内多次触发 (例如编辑器保存)
                // debounce sendSseUpdate if needed
                sendSseUpdate();
              }
            });
          }
        } catch (watchError) {}
      });

      // 将 URL 写入 WebGUI.md
      try {
        // 读取 TEMPLATES_USE 环境变数并转换为语言代码
        const templatesUse = process.env.TEMPLATES_USE || "en";
        const getLanguageFromTemplate = (template: string): string => {
          if (template === "zh") return "zh-TW";
          if (template === "en") return "en";
          // 自订范本预设使用英文
          return "en";
        };
        const language = getLanguageFromTemplate(templatesUse);

        const websiteUrl = `[Task Manager UI](http://localhost:${port}?lang=${language})`;
        const websiteFilePath = path.join(DATA_DIR, "WebGUI.md");
        await fsPromises.writeFile(websiteFilePath, websiteUrl, "utf-8");
      } catch (error) {}

      // 设置进程终止事件处理 (确保移除 watcher)
      const shutdownHandler = async () => {
        // 关闭所有 SSE 连接
        sseClients.forEach((client) => client.end());
        sseClients = [];

        // 关闭 HTTP 伺服器
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
        process.exit(0);
      };

      process.on("SIGINT", shutdownHandler);
      process.on("SIGTERM", shutdownHandler);
    }

    // 创建MCP服务器
    const server = new Server(
      {
        name: "Shrimp Task Manager",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "plan_task",
            description: loadPromptFromTemplate("toolsDescription/planTask.md"),
            inputSchema: zodToJsonSchema(planTaskSchema),
          },
          {
            name: "analyze_task",
            description: loadPromptFromTemplate(
              "toolsDescription/analyzeTask.md"
            ),
            inputSchema: zodToJsonSchema(analyzeTaskSchema),
          },
          {
            name: "reflect_task",
            description: loadPromptFromTemplate(
              "toolsDescription/reflectTask.md"
            ),
            inputSchema: zodToJsonSchema(reflectTaskSchema),
          },
          {
            name: "split_tasks",
            description: loadPromptFromTemplate(
              "toolsDescription/splitTasks.md"
            ),
            inputSchema: zodToJsonSchema(splitTasksRawSchema),
          },
          {
            name: "list_tasks",
            description: loadPromptFromTemplate(
              "toolsDescription/listTasks.md"
            ),
            inputSchema: zodToJsonSchema(listTasksSchema),
          },
          {
            name: "execute_task",
            description: loadPromptFromTemplate(
              "toolsDescription/executeTask.md"
            ),
            inputSchema: zodToJsonSchema(executeTaskSchema),
          },
          {
            name: "verify_task",
            description: loadPromptFromTemplate(
              "toolsDescription/verifyTask.md"
            ),
            inputSchema: zodToJsonSchema(verifyTaskSchema),
          },
          {
            name: "delete_task",
            description: loadPromptFromTemplate(
              "toolsDescription/deleteTask.md"
            ),
            inputSchema: zodToJsonSchema(deleteTaskSchema),
          },
          {
            name: "clear_all_tasks",
            description: loadPromptFromTemplate(
              "toolsDescription/clearAllTasks.md"
            ),
            inputSchema: zodToJsonSchema(clearAllTasksSchema),
          },
          {
            name: "update_task",
            description: loadPromptFromTemplate(
              "toolsDescription/updateTask.md"
            ),
            inputSchema: zodToJsonSchema(updateTaskContentSchema),
          },
          {
            name: "query_task",
            description: loadPromptFromTemplate(
              "toolsDescription/queryTask.md"
            ),
            inputSchema: zodToJsonSchema(queryTaskSchema),
          },
          {
            name: "get_task_detail",
            description: loadPromptFromTemplate(
              "toolsDescription/getTaskDetail.md"
            ),
            inputSchema: zodToJsonSchema(getTaskDetailSchema),
          },
          {
            name: "process_thought",
            description: loadPromptFromTemplate(
              "toolsDescription/processThought.md"
            ),
            inputSchema: zodToJsonSchema(processThoughtSchema),
          },
          {
            name: "init_project_rules",
            description: loadPromptFromTemplate(
              "toolsDescription/initProjectRules.md"
            ),
            inputSchema: zodToJsonSchema(initProjectRulesSchema),
          },
          {
            name: "research_mode",
            description: loadPromptFromTemplate(
              "toolsDescription/researchMode.md"
            ),
            inputSchema: zodToJsonSchema(researchModeSchema),
          },
        ],
      };
    });

    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        try {
          if (!request.params.arguments) {
            throw new Error("No arguments provided");
          }

          let parsedArgs;
          switch (request.params.name) {
            case "plan_task":
              parsedArgs = await planTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await planTask(parsedArgs.data);
            case "analyze_task":
              parsedArgs = await analyzeTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await analyzeTask(parsedArgs.data);
            case "reflect_task":
              parsedArgs = await reflectTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await reflectTask(parsedArgs.data);
            case "split_tasks":
              parsedArgs = await splitTasksRawSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await splitTasksRaw(parsedArgs.data);
            case "list_tasks":
              parsedArgs = await listTasksSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await listTasks(parsedArgs.data);
            case "execute_task":
              parsedArgs = await executeTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await executeTask(parsedArgs.data);
            case "verify_task":
              parsedArgs = await verifyTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await verifyTask(parsedArgs.data);
            case "delete_task":
              parsedArgs = await deleteTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await deleteTask(parsedArgs.data);
            case "clear_all_tasks":
              parsedArgs = await clearAllTasksSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await clearAllTasks(parsedArgs.data);
            case "update_task":
              parsedArgs = await updateTaskContentSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await updateTaskContent(parsedArgs.data);
            case "query_task":
              parsedArgs = await queryTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await queryTask(parsedArgs.data);
            case "get_task_detail":
              parsedArgs = await getTaskDetailSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await getTaskDetail(parsedArgs.data);
            case "process_thought":
              parsedArgs = await processThoughtSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await processThought(parsedArgs.data);
            case "init_project_rules":
              return await initProjectRules();
            case "research_mode":
              parsedArgs = await researchModeSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await researchMode(parsedArgs.data);
            default:
              throw new Error(`Tool ${request.params.name} does not exist`);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error occurred: ${errorMsg} \n Please try correcting the error and calling the tool again`,
              },
            ],
          };
        }
      }
    );

    // 建立连接
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    process.exit(1);
  }
}

main().catch(console.error);
