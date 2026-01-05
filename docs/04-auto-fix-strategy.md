# 自动修复方法 (Auto-fix Strategy)

自动修复是 Linter 极其重要的功能。PascalLint 遵循安全优先的修复原则。

## 1. 修复机制

在规则实现中，通过 `context.report` 的 `fix` 属性提供修复方案。修复器（Fixer）是一个对象，提供操作底层文本的方法。

### Fixer API
*   `insertTextAfter(nodeOrToken, text)`: 在指定节点/Token 后插入文本。
*   `insertTextBefore(nodeOrToken, text)`: 在指定节点/Token 前插入文本。
*   `remove(nodeOrToken)`: 删除节点/Token。
*   `replaceText(nodeOrToken, text)`: 替换节点/Token 内容。
*   `replaceTextRange(range, text)`: 替换指定范围内容。

### 示例代码

```typescript
// 规则：no-semicolon-before-else
context.report({
    node: semicolonNode,
    message: 'Else 前不能有分号',
    fix(fixer) {
        return fixer.remove(semicolonNode);
    }
});
```

## 2. 修复策略

### 2.1 安全修复 vs 建议修复
*   **安全修复 (Auto-fixable)**: 确信修复后不会改变代码逻辑，不会破坏语法。这类修复可通过 CLI `--fix` 自动应用。
    *   例如：删除多余分号、大小写转换、格式化。
*   **建议修复 (Suggestion)**: 可能改变逻辑，或者需要人工确认。这类修复**不**应通过 `--fix` 自动应用，仅在 IDE 中作为 Code Action 提供。
    *   例如：将 `Obj.Free` 转换为 `FreeAndNil(Obj)`（稍微改变语义，将变量置 nil）。

### 2.2 多重修复冲突处理
当多个规则试图修改同一行代码时，可能会发生冲突。Linter 引擎应：
1.  **多轮修复**: 应用一轮无冲突的修复，重新解析 AST，再应用下一轮，直到没有新的修复或达到最大轮次（如 10 次）。
2.  **范围检测**: 拒绝重叠的 TextEdit。

## 3. Code Actions (VSCode 端)

在 VSCode 插件层，接收到带有 `fix` 数据的 Issue 后：
1.  注册 `CodeActionProvider`。
2.  为每个可修复 Issue 生成 `vscode.CodeAction`。
3.  Kind 设置为 `QuickFix`。
4.  对于 **安全修复**，可注册 `source.fixAll` 动作，支持保存时自动修复。

## 4. 复杂重构

对于复杂的重构（如提取方法、重命名），不建议放在 Linter 简单规则中，应作为独立的 Refactoring Code Action 提供。
