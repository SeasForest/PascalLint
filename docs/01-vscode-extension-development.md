# VSCode 插件开发说明

## 1. 架构设计

插件采用 VSCode 标准的 Extension API 进行开发，核心在于将 PascalLint 的分析结果桥接到 VSCode 的诊断（Diagnostic）和代码操作（Code Action）系统。

### 1.1 核心组件

*   **ExtensionHost**: 插件入口 (`extension.ts`)，负责激活、注册命令和事件监听。
*   **DiagnosticCollection**: 用于管理和渲染波浪线错误提示。
*   **CodeActionProvider**: 提供快速修复（Quick Fix）菜单。
*   **LinterService**: 封装 Tree-sitter 解析和规则执行逻辑的单例服务。

### 1.2 工作流

1.  **激活 (Activate)**: 插件启动，加载 WASM 解析器，注册 `onDidSaveTextDocument` 和 `onDidChangeTextDocument` 事件。
2.  **解析 (Parse)**: 当文件变化时，调用 Tree-sitter 生成 AST。
3.  **分析 (Lint)**: 遍历 AST，匹配规则，收集 `LintIssue`。
4.  **报告 (Report)**: 将 `LintIssue` 转换为 `vscode.Diagnostic` 并推送到 `DiagnosticCollection`。
5.  **修复 (Fix)**: 用户点击修复时，`CodeActionProvider` 根据 Issue 信息生成 `WorkspaceEdit`。

## 2. 环境搭建

### 2.1 依赖安装

```bash
npm install
# 安装 tree-sitter CLI 和 语言定义（如果需要重新编译 WASM）
npm install -g tree-sitter-cli
```

### 2.2 调试配置 (.vscode/launch.json)

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "${defaultBuildTask}"
        }
    ]
}
```

## 3. 开发规范

*   **API 使用**: 严格遵循 VSCode API 规范，避免使用已废弃的接口。
*   **异步处理**: 文件读取、解析等耗时操作必须异步执行，避免阻塞 UI 线程。虽然 Tree-sitter 很快，但大规模文件仍需注意。
*   **国际化 (i18n)**: 提示信息应预留多语言支持接口（初期可仅支持英文/中文）。

## 4. 测试

*   **单元测试**: 针对 Rules 的测试，不依赖 VSCode 环境。
*   **集成测试**: 启动 VSCode 实例加载插件，测试真实编辑场景。
