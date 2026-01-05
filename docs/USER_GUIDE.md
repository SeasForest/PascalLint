# 用户使用指南

本文档帮助您安装、配置和使用 PascalLint。

---

## 📥 安装方式

### 方式一: VSCode 扩展 (推荐)

1. 打开 VSCode
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索 "PascalLint"
4. 点击 **安装**

### 方式二: 本地 VSIX

```bash
# 下载 vsix 文件后
code --install-extension pascallint-0.2.0.vsix
```

### 方式三: 命令行工具

```bash
# 全局安装
npm install -g pascallint

# 使用
pslint your-file.pas
```

---

## ⚙️ 配置

### 创建配置文件

在项目根目录创建 `.PascalLint.json`:

```json
{
    "rules": {
        "no-with": "error",
        "empty-begin-end": "warn",
        "use-free-and-nil": "warn",
        "pascal-case": "warn",
        "camel-case": "off",
        "upper-case-keywords": "off"
    },
    "parserOptions": {
        "delphiVersion": "xe"
    },
    "ignorePatterns": [
        "**/node_modules/**",
        "**/__history/**"
    ]
}
```

### 规则严重级别

| 级别 | 说明 |
|:---|:---|
| `"error"` | 错误 (红色波浪线, 阻止提交) |
| `"warn"` | 警告 (黄色波浪线) |
| `"info"` | 信息 (蓝色波浪线) |
| `"off"` | 关闭规则 |

### VSCode 设置

```json
// .vscode/settings.json
{
    "pascallint.enable": true,
    "pascallint.fixOnSave": true,
    "pascallint.configPath": ".PascalLint.json"
}
```

---

## 🔧 命令行使用

### 基本用法

```bash
# 检查单个文件
pslint src/MyUnit.pas

# 检查多个文件
pslint src/*.pas

# 检查整个目录
pslint src/

# 自动修复
pslint --fix src/
```

### 输出格式

```bash
# 默认 (stylish)
pslint src/

# JSON (用于 CI/CD)
pslint --format json src/

# Unix (grep 风格)
pslint --format unix src/

# SonarQube
pslint --format sonar src/ > sonar-report.json
```

### 其他选项

```bash
# 只显示错误 (忽略警告)
pslint --quiet src/

# 初始化配置文件
pslint --init

# 显示帮助
pslint --help
```

---

## 💡 VSCode 功能

### 实时诊断

打开 `.pas` 文件时，PascalLint 自动运行并显示波浪线:

- 🔴 红色 = Error
- 🟡 黄色 = Warning  
- 🔵 蓝色 = Info

### Quick Fix

1. 将光标放在有问题的代码上
2. 按 `Ctrl+.` (或点击💡)
3. 选择修复选项

### Fix All

1. 打开命令面板 (`Ctrl+Shift+P`)
2. 输入 "PascalLint: Fix All Issues"
3. 或者在保存时自动修复 (需启用 `fixOnSave`)

---

## 🔍 规则说明

### no-with ❌

禁止使用 `with` 语句，因为:
- 变量来源不清晰
- 难以维护
- 可能导致意外 bug

```pascal
// ❌ 不好
with Form1 do
  Caption := 'Hello';

// ✅ 好
Form1.Caption := 'Hello';
```

### use-free-and-nil 🔧

使用 `FreeAndNil` 代替 `.Free`:

```pascal
// ⚠️ 不推荐
obj.Free;

// ✅ 推荐 (可自动修复)
FreeAndNil(obj);
```

### dangling-semicolon 🔧

检测意外的空语句:

```pascal
// ❌ Bug! 空语句
if x > 0 then;  // 这个分号是 bug
  DoSomething;  // 总是执行

// ✅ 正确
if x > 0 then
  DoSomething;
```

### empty-begin-end 🔧

检测空代码块:

```pascal
// ⚠️ 空代码块
begin
end;

// ✅ 有意义则加注释
begin
  { TODO: implement }
end;
```

---

## ❓ 常见问题

### Q: 如何忽略特定文件？

A: 在 `.PascalLint.json` 中添加:

```json
{
    "ignorePatterns": [
        "**/Generated/**",
        "**/ThirdParty/**"
    ]
}
```

### Q: 如何忽略特定行？

A: 使用注释 (计划中):

```pascal
obj.Free; // pascallint-disable-line use-free-and-nil
```

### Q: 扩展不工作？

A: 检查:
1. 文件是否是 `.pas` / `.dpr` / `.dpk`
2. VSCode 输出面板是否有错误
3. 是否安装了 tree-sitter-pascal.wasm

### Q: 如何报告 Bug？

A: 在 [GitHub Issues](https://github.com/SeasForest/PascalLint/issues) 提交，包含:
1. PascalLint 版本
2. 问题代码
3. 预期行为 vs 实际行为
