# 规则集 (Rule Set)

本文档规划 PascalLint 的核心规则集。规则分为三个主要类别：**错误 (Possible Errors)**、**最佳实践 (Best Practices)** 和 **风格 (Stylistic Issues)**。

## 1. 规则命名规范
*   格式：`kebab-case` (短横线分隔的小写字母)。
*   前缀（可选）：插件规则可加前缀，核心规则直接命名。

## 2. 核心规则规划 (v0.2+)

### Potential Errors (潜在错误)
| ID | 描述 | 可修复 | 优先级 |
| :--- | :--- | :---: | :---: |
| `no-with` | 禁止使用 `with` 语句 (易混淆作用域) | ⚠️ | Error |
| `constructor-call-on-instance` | 禁止在实例上调用构造函数 (e.g., `obj.Create`) | ❌ | Error |
| `no-empty-finally` | 禁止空的 `finally` 块 | ❌ | Warning |
| `dangling-semicolon` | 检测意外的空语句分号 (如 `if condition then;`) | ✅ | Error |

### Best Practices (最佳实践)
| ID | 描述 | 可修复 | 优先级 |
| :--- | :--- | :---: | :---: |
| `check-assigned` | 建议在 Free 前检查 Assigned (针对非 FreeAndNil 场景) | ❌ | Info |
| `use-free-and-nil` | 建议使用 `FreeAndNil(Obj)` 代替 `Obj.Free` | ✅ | Warning |
| `empty-begin-end` | 空的 `begin...end` 块 | ✅ | Info |
| `unreachable-code` | 检测不可达代码 (如 `Exit` 后的语句) | ❌ | Warning |
| `parameter-casing` | 参数命名一致性检查 | ❌ | Info |

### Stylistic Issues (代码风格)
| ID | 描述 | 可修复 | 优先级 |
| :--- | :--- | :---: | :---: |
| `pascal-case` | 类名、方法名强制 PascalCase | ✅ | Warning |
| `camel-case` | 局部变量强制 camelCase | ❌ | Info |
| `indentation` | 缩进检查 (默认 2 空格) | ✅ | Warning |
| `one-var-per-line` | 每个变量声明占一行 | ✅ | Info |
| `no-semicolon-before-else` | `else` 前禁止分号 | ✅ | Error |
| `upper-case-keywords` | 关键字大写/小写偏好设置 | ✅ | Info |

## 3. 规则配置示例

在 `.PascalLint.json` 中：

```json
{
  "rules": {
    "no-with": "error",
    "use-free-and-nil": "warn",
    "indentation": ["warn", { "size": 2 }],
    "upper-case-keywords": "off"
  }
}
```

## 4. SonarQube 兼容性 (Compatibility)

为了方便现有 Delphi 项目迁移，我们将尽可能兼容 SonarQube (Delphi Plugin) 的核心规则，并提供 ID 映射。

### 映射策略
*   **规则对齐**: 优先实现 SonarQube High/Critical 级别的规则。
*   **配置兼容**: 主要支持通过 `.PascalLint.json` 映射 Sonar 规则配置，或者未来支持导入 Quality Profile。

### 常见 Sonar 规则映射表 (示例)

| PascalLint ID | SonarQube ID | 描述 |
| :--- | :--- | :--- |
| `no-with` | `Delphi.NoWith` (假设) | Avoid using `with` statement |
| `empty-begin-end` | `squid:S108` | Nested blocks of code should not be left empty |
| `one-var-per-line` | `Delphi.OneVarPerLine` | One variable declaration per line |
| `max-function-length` | `squid:S138` | Methods should not be too complex/long |

## 5. 自定义规则

用户可以在 `.PascalLint/rules` 目录下编写特定项目的规则（.ts/.js），并在配置中引用。
