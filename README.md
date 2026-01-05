# PascalLint

🔍 **静态分析工具** for Delphi/Object Pascal，基于 Tree-sitter WASM。

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-14%20passed-green.svg)](test/)
[![Coverage](https://img.shields.io/badge/coverage-94%25-green.svg)](jest.config.js)

---

## ⚡ 快速开始

### 1. 安装依赖

```bash
git clone https://github.com/SeasForest/PascalLint.git
cd PascalLint
npm install
```

### 2. 编译项目

```bash
npm run compile
```

### 3. 运行 Lint

```bash
# 使用 CLI
node ./out/cli/index.js your-file.pas

# 自动修复
node ./out/cli/index.js --fix your-file.pas

# JSON 格式输出
node ./out/cli/index.js --format json your-file.pas
```

---

## Supported Rules

Currently, **12 rules** are supported, categorized by type:

### Potential Errors
| Rule ID | Description | Auto-Fix |
| :--- | :--- | :---: |
| `no-with` | Disallow `with` statements to avoid scope confusion | ❌ |
| `dangling-semicolon` | Detect unexpected semicolons after `if`/`while`/`for` | ✅ |
| `no-empty-finally` | Disallow empty `finally` blocks | ✅ |
| `unreachable-code` | Detect code that can never be executed | ✅ |
| `no-exit-in-finally` | Disallow `Exit` / `Raise` in `finally` blocks | ✅ |

### Best Practices
| Rule ID | Description | Auto-Fix |
| :--- | :--- | :---: |
| `empty-begin-end` | Detect empty `begin...end` blocks | ✅ |
| `use-free-and-nil` | Suggest `FreeAndNil(Obj)` instead of `Obj.Free` | ✅ |
| `check-assigned` | Suggest `Assigned(Obj)` check before freeing | ✅ |

### Stylistic Issues
| Rule ID | Description | Auto-Fix |
| :--- | :--- | :---: |
| `pascal-case` | Enforce PascalCase for class/method names | ✅* |
| `one-var-per-line` | Enforce one variable declaration per line | ✅ |
| `camel-case` | Enforce camelCase for variables/parameters | ✅* |
| `upper-case-keywords` | Enforce consistent keyword casing | ✅ |

> **Note**: Auto-fixes for naming conventions (`pascal-case`, `camel-case`) only rename the declaration. You may need to manually update references or use the IDE's rename refactoring tool.

---

## 📁 项目结构

```
PascalLint/
├── src/
│   ├── cli/                 # 命令行工具
│   │   ├── index.ts         # CLI 入口
│   │   └── formatters.ts    # 输出格式化
│   ├── parser/              # Tree-sitter 解析器
│   │   ├── index.ts         # 导出
│   │   └── pascal-parser.ts # 解析器封装
│   ├── linter/              # Linter 引擎
│   │   ├── index.ts         # 导出
│   │   └── linter-service.ts# 核心服务
│   ├── rules/               # 14 条 Lint 规则
│   │   ├── index.ts         # 规则注册
│   │   ├── no-with.ts       # 禁止 with
│   │   └── ...              # 其他规则
│   ├── config/              # 配置加载
│   │   └── config-loader.ts
│   ├── providers/           # VSCode 提供者
│   │   └── code-action-provider.ts
│   ├── types/               # TypeScript 类型
│   │   └── index.ts
│   └── extension.ts         # VSCode 扩展入口
├── parsers/
│   └── tree-sitter-pascal.wasm  # Pascal 语法 WASM
├── test/
│   ├── fixtures/            # Pascal 测试用例
│   │   ├── sample.pas       # 综合测试
│   │   └── valid/           # 无问题代码
│   ├── rules/               # 规则单元测试
│   └── config/              # 配置测试
├── docs/                    # 详细文档
├── .PascalLint.json         # 配置示例
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

---

## 🔧 本地开发

### 1. 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- VSCode (用于扩展开发)

### 2. 开发命令

```bash
# 编译
npm run compile

# 监听模式 (自动重编译)
npm run watch

# 代码检查
npm run lint
npm run lint:fix

# 格式化
npm run format

# 运行测试
npm test
npm run test:watch
```

### 3. VSCode 扩展调试

1. 用 VSCode 打开项目
2. 按 **F5** 启动 Extension Development Host
3. 在新窗口打开 `.pas` 文件
4. 查看波浪线诊断和 Quick Fix

---

## 🧪 测试

### 单元测试

```bash
npm test
```

测试文件位于 `test/` 目录，使用 Jest 框架。

### Pascal 测试用例

```bash
# 运行 CLI 测试综合用例
node ./out/cli/index.js test/fixtures/sample.pas

# 验证无误报
node ./out/cli/index.js test/fixtures/valid/clean-code.pas
```

---

## 📖 详细文档

- [VSCode 扩展开发指南](docs/01-vscode-extension-development.md)
- [CLI 实现指南](docs/02-pslint-implementation.md)
- [规则集说明](docs/03-rule-set.md)
- [Tree-sitter 使用指南](docs/tree-sitter-guide.md)
- [开发者指南](docs/CONTRIBUTING.md)

---

## 📜 License

MIT
