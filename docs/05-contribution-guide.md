# 代码编写与贡献规范

## 1. 核心开发语言

项目完全使用 **TypeScript** 开发。
*   版本要求：`>= 4.5`
*   严格模式：`strict: true`

## 2. 代码风格 (Style Guide)

本项目自身的代码风格遵循以下标准（使用 ESLint + Prettier 强制执行）：

*   **缩进**: 2 空格。
*   **分号**: 必须使用分号。
*   **引号**: 单引号优先 (`'`).
*   **命名**:
    *   类/接口: `PascalCase`
    *   变量/函数: `camelCase`
    *   常量: `UPPER_SNAKE_CASE`
*   **文件命名**: `kebab-case.ts` (例如 `rule-manager.ts`)。

## 3. AST 处理规范

处理 Tree-sitter AST 时：
*   **节点检查**: 始终检查 `node.type`，不要假设节点类型。
*   **空安全**: Tree-sitter 的子节点访问（如 `childForFieldName`）常返回 `null`，必须做好空值检查。
*   **遍历效率**: 尽量使用特定的 Visitor 模式，减少全树遍历。

## 4. 提交规范 (Commit Convention)

遵循 **Conventional Commits** 规范：

```text
<type>(<scope>): <subject>
```

*   **type**:
    *   `feat`: 新特性 (New feature)
    *   `fix`: 修复 Bug
    *   `docs`: 文档变更
    *   `style`: 代码格式调整（不影响逻辑）
    *   `refactor`: 重构（既非修复 Bug 也非新特性）
    *   `test`: 增加或修改测试
    *   `chore`: 构建过程或辅助工具变动
*   **scope**: (可选) 影响范围，如 `parser`, `extension`, `cli`。

示例：
*   `feat(rules): add no-with rule`
*   `fix(parser): fix crash on empty file`
*   `docs: update roadmap`

## 5. Pull Request 流程

1.  Fork 本仓库。
2.  创建特性分支 (`git checkout -b feat/new-rule`).
3.  提交更改。
4.  确保所有测试通过 (`npm test`).
5.  提交 PR 到 `main` 分支。
