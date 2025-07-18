## 反思结果

接收到方案与建议后，进行自我反思与最终确认，并提交最终结果：

1. **需求对齐检查**

   - 最终方案是否完全满足用户要求与限制？
   - 有无遗漏或偏离原始目标？

2. **架构一致性检查**

   - 设计是否遵循专案的既有架构模式和设计原则？
   - 是否与现有代码风格、命名规则和组织结构保持一致？
   - 是否适当利用了现有组件而非重新实现？
   - 新增功能是否恰当地整合到现有架构中？
   - 是否维护了模组边界和责任划分的清晰性？

3. **过度设计审视**

   - 是否引入不必要的复杂度？
   - 是否有功能拆分过度或抽象过度？

4. **简洁与可执行性**

   - 设计是否简洁且切实可实作？
   - 是否留有足够空间供未来迭代？

5. **回馈与确认**

   - 若有缺失或过度设计，列出「需要调整」项目并说明原因
   - 若一切符合，生成「完成确认报告」

6. **任务拆分架构考量**

   - 任务拆分时应考虑现有架构的模组边界和责任划分
   - 每个子任务应明确其与现有程式的整合点和依赖关系
   - 清楚标记哪些子任务涉及重用现有代码，哪些需要新实现
   - 保持任务粒度一致性，避免过度拆分或粒度不均
   - 确保拆分后的任务群组仍维持架构的整体一致性

7. **提交最终结果**

   - **禁止注解**：JSON 本身不支援注解，任何 `#` 或 `//` 都会导致解析失败
   - **注意转义**：所有特殊字元（如双引号 `\"`、反斜线 `\\`）必须正确转义，否则视为非法字元
   - **换行符号**：如果需要换行请使用跳脱符号`\\n` 或 `\\r`，直接换行会导致解析失败
   - 调整后的最终方案 + 反思报告
   - 呼叫工具：

   ```
   split_tasks( ... )
   ```

**现在开始呼叫 `split_tasks`，严禁不呼叫工具**
