# 开发者指南 (CONTRIBUTING)

本文档面向想要参与 PascalLint 开发的贡献者。

---

## 🏃 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/SeasForest/PascalLint.git
cd PascalLint

# 2. 安装依赖
npm install

# 3. 编译
npm run compile

# 4. 运行测试
npm test

# 5. 启动 VSCode 调试
code .
# 按 F5 启动 Extension Development Host
```

---

## 📁 代码结构说明

### 核心模块

| 目录 | 职责 |
|:---|:---|
| `src/parser/` | 封装 Tree-sitter WASM，提供 parse/parseIncremental |
| `src/linter/` | Linter 引擎，遍历 AST 执行规则 |
| `src/rules/` | 具体的 Lint 规则实现 |
| `src/config/` | 配置文件加载与合并 |
| `src/cli/` | 命令行工具入口 |
| `src/providers/` | VSCode CodeActionProvider |
| `src/extension.ts` | VSCode 扩展入口 |

### 数据流

```
Pascal 源码
    ↓
Tree-sitter Parser (WASM)
    ↓
AST (SyntaxNode)
    ↓
LinterService.traverseTree()
    ↓
各 Rule.create() 返回的 RuleListener
    ↓
issues[] (LintIssue[])
    ↓
VSCode Diagnostics / CLI Output
```

---

## 🧬 PascalLint 原理

### 1. Tree-sitter 解析

Tree-sitter 是增量解析器生成器，将源代码解析为 **AST (抽象语法树)**。

```typescript
// src/parser/pascal-parser.ts
import Parser from 'web-tree-sitter';

// 加载 WASM
const language = await Parser.Language.load('tree-sitter-pascal.wasm');
parser.setLanguage(language);

// 解析
const tree = parser.parse(sourceCode);
// tree.rootNode 是 AST 根节点
```

### 2. AST 遍历

```typescript
// src/linter/linter-service.ts
private traverseTree(node: Parser.SyntaxNode, listeners: Map) {
    // 查找监听该节点类型的规则
    const handlers = listeners.get(node.type);
    if (handlers) {
        for (const { listener } of handlers) {
            listener[node.type]?.(this.adaptNode(node));
        }
    }
    // 递归子节点
    for (const child of node.children) {
        this.traverseTree(child, listeners);
    }
}
```

### 3. 规则实现

每个规则返回一个 RuleListener，监听特定节点类型：

```typescript
// src/rules/no-with.ts
export const noWithRule: LintRule = {
    id: 'no-with',
    meta: { description: '...', fixable: false },
    defaultSeverity: 'error',
    
    create(context: RuleContext): RuleListener {
        return {
            // 监听 'with' 节点
            with(node: TreeSitterNode) {
                context.report({
                    message: "Avoid using 'with' statement.",
                    range: { start: node.startPosition, end: node.endPosition },
                });
            },
        };
    },
};
```

---

## 🌳 Tree-sitter-Pascal 使用

### 节点类型

常见的 Pascal AST 节点类型：

| 节点类型 | 描述 |
|:---|:---|
| `program` | 根节点 |
| `unit` | unit 声明 |
| `block` | begin...end 块 |
| `with` | with 语句 |
| `if` | if 语句 |
| `for` | for 循环 |
| `statement` | 语句 |
| `identifier` | 标识符 |
| `kBegin`, `kEnd` | 关键字 |

### 调试 AST

```bash
# 查看 AST 结构
node ./out/debug-ast.js your-file.pas
```

---

## ✍️ 添加新规则

### 1. 创建规则文件

```typescript
// src/rules/my-new-rule.ts
import { LintRule, RuleContext, RuleListener, TreeSitterNode } from '../types';

export const myNewRule: LintRule = {
    id: 'my-new-rule',
    meta: {
        description: '规则描述',
        category: 'error', // error | best-practice | style
        fixable: false,    // 是否可自动修复
        docs: { description: '详细说明' },
    },
    defaultSeverity: 'error', // error | warn | info | off
    
    create(context: RuleContext): RuleListener {
        return {
            // 监听节点类型
            statement(node: TreeSitterNode) {
                // 检查逻辑
                if (isBad(node)) {
                    context.report({
                        message: '问题描述',
                        range: {
                            start: { line: node.startPosition.row, column: node.startPosition.column, offset: node.startIndex },
                            end: { line: node.endPosition.row, column: node.endPosition.column, offset: node.endIndex },
                        },
                        // 可选: 自动修复
                        fix: fixable ? {
                            range: { /* ... */ },
                            text: 'replacement',
                        } : undefined,
                    });
                }
            },
        };
    },
};
```

### 2. 注册规则

```typescript
// src/rules/index.ts
import { myNewRule } from './my-new-rule';

export const allRules: LintRule[] = [
    // ...existing rules
    myNewRule,
];
```

### 3. 添加默认配置

```typescript
// src/config/config-loader.ts
export function getDefaultRules() {
    return {
        // ...existing
        'my-new-rule': 'error',
    };
}
```

### 4. 编写测试

```typescript
// test/rules/my-new-rule.test.ts
describe('my-new-rule', () => {
    it('should detect the issue', () => {
        const listener = myNewRule.create(context);
        listener.statement?.(mockNode);
        expect(issues).toHaveLength(1);
    });
});
```

### 5. 添加 Pascal 测试用例

```pascal
// test/fixtures/sample.pas
{ RULE: my-new-rule }
procedure TestMyNewRule;
begin
  // ❌ Should trigger
  BadCode;
  
  // ✓ Should NOT trigger
  GoodCode;
end;
```

---

## 📝 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `style`: 格式 (不影响代码运行)
- `refactor`: 重构 (不是新功能也不是 bug 修复)
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建过程或辅助工具

### 示例

```bash
feat(rules): add no-with rule

Disallows the use of 'with' statement as it makes code harder to maintain.

Closes #12
```

```bash
fix(parser): fix WASM memory leak

Trees are now explicitly deleted when content changes.

Fixes #45
```

---

## 🚀 发布流程

### 1. 更新版本号

```bash
npm version patch  # 0.2.0 -> 0.2.1
npm version minor  # 0.2.0 -> 0.3.0
npm version major  # 0.2.0 -> 1.0.0
```

### 2. 构建 VSIX

```bash
npm run package
# 生成 pascallint-0.2.0.vsix
```

### 3. 发布到 VSCode Marketplace

```bash
npm run publish
# 需要 PAT token
```

---

## 🔍 调试技巧

### VSCode 扩展调试

1. 打开 `src/extension.ts`
2. 设置断点
3. 按 **F5** 启动
4. 在 Extension Development Host 打开 `.pas` 文件

### 查看日志

在 Extension Development Host:
- **View** → **Output**
- 选择 **PascalLint**

### 调试 CLI

```bash
node --inspect-brk ./out/cli/index.js test/fixtures/sample.pas
```

---

## ❓ 常见问题

### Q: tree-sitter-pascal.wasm 在哪里获取？

A: 需要自行编译：

```bash
git clone https://github.com/Isopod/tree-sitter-pascal.git
cd tree-sitter-pascal
npm install -g tree-sitter-cli
tree-sitter build --wasm
cp tree-sitter-pascal.wasm /path/to/PascalLint/parsers/
```

### Q: 为什么规则没有触发？

A: 检查:
1. 节点类型是否正确 (用 debug-ast.js 查看)
2. 规则是否在 index.ts 中注册
3. 配置文件中规则是否设为 'off'

### Q: 如何处理 Tree-sitter 不支持的语法？

A: 需要修改 tree-sitter-pascal 的 grammar.js 并重新编译 WASM。
