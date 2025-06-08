# 开发守则

本文档为 AI Agent 在 `mcp-shrimp-task-manager` 专案中执行开发任务的专用规范。

## 1. 专案概述

- **专案名称**: `mcp-shrimp-task-manager`
- **目的**: 一个为 AI Agents 设计的任务管理工具，强调思维链、反思和风格一致性。它将自然语言转换为结构化的开发任务，并具有依赖追踪和迭代优化功能。
- **技术栈**:
  - 主要语言: TypeScript
  - 执行环境: Node.js (ES Module)
  - 主要框架/函式库: Express.js (用于可能的 API 或 WebGUI), Zod (用于资料验证)
  - 套件管理器: pnpm
- **核心功能**:
  - 自然语言任务解析
  - 结构化任务生成与管理
  - 任务依赖关系追踪
  - 任务执行与验证辅助
  - 与 AI Agent 的思维流程整合

## 2. 专案架构

- **主要原始码目录**: `src/`
  - `src/index.ts`: 主要应用程式入口或模组汇出点。**修改此档案需谨慎评估影响范围。**
  - `src/utils/`: 通用工具函式。
  - `src/types/`: TypeScript 型别定义。**新增或修改型别时，务必确保与 Zod schema (如适用) 一致性。**
  - `src/tools/`: 专案特定工具或与外部服务整合的模组。
  - `src/models/`: 资料模型定义 (可能与 Zod schemas 相关)。
  - `src/prompts/`: AI 互动相关的提示词模板。**修改或新增提示词时，需考虑对 AI Agent 行为的潜在影响。**
  - `src/public/`: WebGUI 或其他静态资源。
  - `src/tests/`: 单元测试和整合测试。
- **编译输出目录**: `dist/` (此目录由 `tsc` 自动生成，**禁止手动修改此目录内容**)。
- **设定档**:
  - `package.json`: 专案依赖和脚本。**新增依赖后，必须执行 `pnpm install`。**
  - `tsconfig.json`: TypeScript 编译设定。**非必要情况下，禁止修改 `"strict": true` 设定。**
  - `.env.example` & `.env`: 环境变数设定。**敏感资讯不得提交至版本控制。**
- **文件**:
  - `README.md`: 主要专案说明文件。
  - `docs/`: 可能包含更详细的架构、API 文件等。
  - `CHANGELOG.md`: 版本变更纪录。**每次发布新版本前必须更新。**
  - `data/WebGUI.md`: 包含 Task Manager UI 的连结。

## 3. 程式码规范

### 3.1. 命名规范

- **变数与函式**: 使用小驼峰命名法 (camelCase)。
  - _范例 (可做)_: `const taskName = "example"; function processTask() {}`
  - _范例 (不可做)_: `const Task_Name = "example"; function Process_Task() {}`
- **类别与介面**: 使用大驼峰命名法 (PascalCase)。
  - _范例 (可做)_: `class TaskManager {}; interface ITaskOptions {}`
  - _范例 (不可做)_: `class taskManager {}; interface iTaskOptions {}`
- **档案名称**: 使用小驼峰命名法或横线连接 (kebab-case) 的 `.ts` 档案。
  - _范例 (可做)_: `taskProcessor.ts`, `task-utils.ts`
  - _范例 (不可做)_: `TaskProcessor.ts`, `task_utils.ts`
- **常数**: 使用全大写蛇形命名法 (UPPER_SNAKE_CASE)。
  - _范例 (可做)_: `const MAX_RETRIES = 3;`
  - _范例 (不可做)_: `const maxRetries = 3;`

### 3.2. 格式要求

- **缩排**: 使用 2 个空格进行缩排。**禁止使用 Tab 字元。**
- **分号**: 每行叙述句尾必须加上分号。
- **引号**: 字串优先使用单引号 (`'`)，除非字串本身包含单引号。
  - _范例 (可做)_: `const message = 'Hello World'; const complex = "It\\'s complex";`
  - _范例 (不可做)_: `const message = "Hello World";`
- **最大行长度**: 建议不超过 120 字元。
- **注解**:
  - 单行注解使用 `//`。
  - 多行注解使用 `/* ... */`。
  - JSDoc 风格的注解应用于公开的函式、类别和方法。
    - _范例 (可做)_:
      ```typescript
      /**
       * Processes a given task.
       * @param taskId The ID of the task to process.
       * @returns True if successful, false otherwise.
       */
      function processTaskById(taskId: string): boolean {
        // implementation
        return true;
      }
      ```

### 3.3. TypeScript 特定规范

- **型别注解**: 所有函式参数、回传值和变数宣告都应有明确的型别注解。**禁止使用 `any` 型别，除非在极特殊且无法避免的情况下，并需加上注解说明原因。**
  - _范例 (可做)_: `function greet(name: string): string { return \`Hello, ${name}\`; }`
  - _范例 (不可做)_: `function greet(name): any { return "Hello, " + name; }`
- **介面与型别别名**: 优先使用介面 (Interface) 定义物件的形状，使用型别别名 (Type Alias) 定义联合型别、元组或其他复杂型别。
- **ES Module**: 使用 `import` 和 `export` 语法。
  - _范例 (可做)_: `import { Task } from './models/task'; export class TaskService {}`
  - _范例 (不可做)_: `const Task = require('./models/task'); module.exports = TaskService;`
- **严格模式**: 专案已启用 `"strict": true`。必须解决所有 TypeScript 的严格模式错误。

## 4. 功能实作规范

### 4.1. 通用原则

- **单一职责原则 (SRP)**: 每个函式和类别应只负责一项功能。
- **保持简洁 (KISS)**: 避免过度复杂的解决方案。
- **重复利用**: 尽可能将通用逻辑抽取为可重用函式或类别，存放于 `src/utils/` 或相关模组。
- **错误处理**:
  - 使用 `try...catch` 处理预期内的错误。
  - 对于关键操作，应提供清晰的错误讯息。
  - 考虑使用自定义错误类别以提供更丰富的错误资讯。
- **日志记录**:
  - 在关键操作、错误处理和重要状态变更时加入日志记录。
  - 考虑使用结构化日志。
  - **禁止在日志中记录敏感资讯 (如密码、API Keys)。**

### 4.2. Zod 使用

- 位于 `src/models/` 或 `src/types/` 的资料结构定义，应优先使用 Zod schema 进行定义和验证。
- Zod schema 应与 TypeScript 型别保持同步。可使用 `z.infer<typeof schema>` 生成型别。

  - _范例 (可做)_:

    ```typescript
    import { z } from "zod";

    export const TaskSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      description: z.string().optional(),
    });

    export type Task = z.infer<typeof TaskSchema>;
    ```

### 4.3. Express.js 使用 (若有 API/WebGUI)

- 路由定义应清晰且遵循 RESTful 原则 (若为 API)。
- 中介软体 (Middleware) 应有效组织，例如错误处理中介软体、日志中介软体等。
- 所有外部输入 (request parameters, body, query) **必须**经过 Zod 或类似机制验证。

## 5. 框架/外挂程式/第三方库使用规范

- **新增依赖**:
  - **必须**先评估依赖的必要性、维护状态和安全性。
  - 使用 `pnpm add <package-name>` (用于执行依赖) 或 `pnpm add -D <package-name>` (用于开发依赖)。
  - **必须**在 `package.json` 中指定明确的版本范围 (例如 `^1.2.3` 或 `~1.2.3`)，避免使用 `*`。
- **更新依赖**: 定期检查并更新依赖至最新稳定版本，以获取安全性修补和新功能。更新前需评估潜在的破坏性变更。
- **移除依赖**: 若不再需要某个依赖，使用 `pnpm remove <package-name>` 将其移除，并从程式码中移除相关引用。

## 6. 工作流程规范

### 6.1. 开发流程

1.  **理解任务**: 仔细阅读任务描述、需求和验收标准。
2.  **分支管理**: 从最新的 `main` (或 `develop`) 分支建立新的特性分支 (feature branch)。分支名称应简洁明了，例如 `feature/add-task-editing` 或 `fix/login-bug`。
3.  **编码与测试**:
    - 按照本规范进行编码。
    - **必须**为新功能或修复的 bug 编写单元测试 (存放于 `src/tests/`)。
    - 执行 `pnpm run build` 确保程式码可以成功编译。
    - 本地执行 `pnpm run dev` 或 `pnpm run start` 进行测试。
4.  **程式码提交**:
    - Git commit message 应遵循 Conventional Commits 规范 (例如 `feat: add user authentication`, `fix: resolve issue with task sorting`)。
    - **禁止提交包含 `console.log` 或其他侦错讯息的程式码至主要分支。**
5.  **Pull Request (PR)**:
    - 将特性分支推送到远端仓库，并建立 Pull Request 至 `main` (或 `develop`) 分支。
    - PR 描述应清晰说明变更内容和原因。
6.  **Code Review**: 等待其他开发者或 AI Agent 进行 Code Review。
7.  **合并与部署**: Code Review 通过后，合并 PR。部署流程依专案设定。

### 6.2. 版本控制 (Git)

- **主要分支**:
  - `main`: 代表稳定且可部署的产品版本。
  - `develop` (若使用): 代表开发中的最新版本。
- **提交频率**: 建议小步快跑，频繁提交有意义的变更。
- **解决冲突**: 合并或 rebase 分支时，若发生冲突，**必须**仔细解决，确保程式码的正确性和完整性。

### 6.3. CHANGELOG 更新

- 在发布新版本之前，**必须**更新 `CHANGELOG.md`。
- 纪录应包含版本号、发布日期以及新增功能、修复的错误和重大变更列表。

## 7. 关键档案交互规范

- **修改 `src/types/` 或 `src/models/` (特别是 Zod schemas)**:
  - **必须**检查并更新所有引用到这些型别或 schema 的档案，确保型别一致性。
  - **必须**重新执行相关测试。
- **修改 `src/index.ts`**:
  - 若修改了模组的汇出 API，**必须**检查所有依赖此模组的专案或档案，并进行相应调整。
- **修改 `package.json` (特别是 `dependencies` 或 `scripts`)**:
  - **必须**通知团队成员或相关 AI Agent 执行 `pnpm install`。
  - 若修改 `scripts`，需确保 CI/CD 流程 (若有) 也相应更新。
- **修改 `.env.example`**:
  - **必须**同步更新所有开发环境的 `.env` 档案，并通知团队成员。
- **修改 `README.md` 或 `docs/` 内的文档**:
  - 若变更涉及核心功能或使用方式，**必须**确保文件内容的准确性和即时性。

## 8. AI 决策规范

### 8.1. 处理模糊请求

- 当收到模糊的开发指令时 (例如 "优化任务列表显示")：
  1.  **尝试澄清**: 若可能，向用户或任务发起者请求更具体的细节或预期结果。
  2.  **分析上下文**: 检查相关程式码 (`src/`)、现有 UI (若有)、相关 issue (若有) 来推断可能的意图。
  3.  **提出方案**: 基于分析，提出 1-2 个具体的实施方案，并说明各自的优缺点及预计工作量。
  4.  **等待确认**: 在获得明确指示前，不进行大规模程式码修改。

### 8.2. 错误/异常处理策略

- **优先级**:
  1.  **使用者体验**: 避免程式崩溃，提供友好的错误提示。
  2.  **资料完整性**: 确保错误不会导致资料损坏或不一致。
  3.  **系统稳定性**: 记录详细错误资讯以供排查。
- **选择**:
  - 对于可预期的错误 (例如使用者输入无效)，应在该操作的上下文中处理并给予提示。
  - 对于意外的系统错误，应捕获、记录，并可能向上抛出或触发全域错误处理机制。

### 8.3. 依赖选择

- 当需要引入新的第三方函式库时：
  1.  **检查现有**: 确认专案中是否已有可满足需求的类似函式库。
  2.  **评估选项**:
      - **活跃度与社群支援**: 选择维护良好、社群活跃的函式库。
      - **轻量级**: 避免引入过于庞大或功能冗余的函式库。
      - **安全性**: 检查是否有已知的安全漏洞。
      - **授权条款 (License)**: 确保与专案授权相容。
  3.  **最小化原则**: 仅引入确实需要的函式库。

## 9. 禁止事项

- **禁止直接修改 `dist/` 目录下的任何档案。** 该目录为编译产物。
- **禁止在未执行 `pnpm install` 的情况下，假定新依赖可用。**
- **禁止在主要分支 (`main` 或 `develop`) 直接提交未经测试或未完成的程式码。** 必须使用特性分支。
- **禁止提交包含 API Keys、密码或其他敏感资讯的程式码至版本控制系统。** 使用 `.env` 档案管理此类资讯。
- **禁止在未告知或未获同意的情况下，大幅修改核心架构或公共 API。**
- **禁止忽略 TypeScript 的型别错误。** 必须解决所有 `tsc` 报告的错误。
- **禁止在没有充分理由和注解的情况下使用 `any` 型别。**
- **禁止在程式码中留下大量的 `console.log` 或其他临时侦错程式码。**
- **禁止在未更新 `CHANGELOG.md` 的情况下发布新版本。**
- **禁止引入与专案 MIT 授权条款不相容的第三方函式库。**

## 10. 更新此规范文件 (`shrimp-rules.md`)

- 当专案的技术栈、核心架构、主要工作流程或重要规范发生变动时，**必须**同步更新此文件。
- 更新请求应明确指出需要变更的章节和内容。
- 若收到模糊的 "更新规则" 指令，AI Agent **必须**：
  1.  自主分析当前程式码库的变更 (例如 `git diff`、最近的 commit)。
  2.  比较现有的 `shrimp-rules.md` 与专案现状，找出不一致或过时的规则。
  3.  在 `process_thought` 阶段列出推断的更新点及其理由。
  4.  提出具体的修改建议，或直接编辑此文件。
  5.  **严格禁止**在执行自主分析前就模糊请求向用户寻求澄清。

---

此开发守则旨在确保 AI Agent 能够高效、一致且安全地参与 `mcp-shrimp-task-manager` 专案的开发。
