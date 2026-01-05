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

## 🎯 支持的规则 (14 条)

| 规则 | 类型 | 可修复 | 描述 |
|:---|:---:|:---:|:---|
| `no-with` | Error | ❌ | 禁止 `with` 语句 |
| `no-semicolon-before-else` | Error | ✅ | `else` 前不能有分号 |
| `dangling-semicolon` | Error | ✅ | 检测意外的空语句 |
| `no-empty-finally` | Warn | ❌ | 禁止空 `finally` 块 |
| `unreachable-code` | Error | ❌ | 检测死代码 |
| `constructor-call-on-instance` | Error | ❌ | 禁止实例调用 Create |
| `no-exit-in-finally` | Error | ❌ | finally 中禁止 exit |
| `empty-begin-end` | Warn | ✅ | 检测空代码块 |
| `use-free-and-nil` | Warn | ✅ | 建议用 FreeAndNil |
| `check-assigned` | Info | ❌ | 建议检查 Assigned |
| `pascal-case` | Warn | ❌ | 类名 PascalCase |
| `camel-case` | Off | ❌ | 变量 camelCase |
| `one-var-per-line` | Info | ❌ | 单行单变量 |
| `upper-case-keywords` | Off | ✅ | 关键字大小写 |

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
