# PascalLint 安装与测试指南

## 安装步骤

### 1. 安装前置依赖

**必须先安装 Pascal 语言支持扩展**（提供语法高亮）：

```bash
# 方法 A: 命令行安装
code --install-extension alefragnani.pascal

# 方法 B: 在 VSCode 扩展市场搜索
# 搜索 "Pascal" 并安装 "Pascal" by Alessandro Fragnani
```

### 2. 安装 PascalLint

```bash
# 安装 .vsix 文件
code --install-extension pascallint-0.2.0.vsix

# 或者在 VSCode 中:
# Ctrl+Shift+P (Cmd+Shift+P on Mac)
# "Install from VSIX..."
# 选择 pascallint-0.2.0.vsix
```

### 3. 重启 VSCode

安装完成后，**必须重启 VSCode** 才能激活插件。

---

## 测试清单

### 基础功能测试

1. **创建测试文件** `test.pas`:
   ```pascal
   unit Unit1;

   interface

   implementation

   procedure Test;
   var
     x: Integer;
   begin
     x := 1;;

     if True then
       ;

     with x do
       x := 2;

     x.Free;
   end;

   end.
   ```

2. **检查诊断信息**：
   - 打开 `test.pas` 文件
   - 应该看到以下错误：
     - ❌ `dangling-semicolon`: 双分号 (line 12)
     - ❌ `empty-begin-end`: 空 begin...end 块 (line 15)
     - ❌ `no-with`: 使用 with 语句 (line 17)
     - ⚠️ `use-free-and-nil`: 建议使用 FreeAndNil (line 19)

3. **测试 Quick Fix**：
   - 点击错误旁边的 💡 灯泡图标
   - 选择 "Fix: ..." 自动修复

4. **测试命令**：
   - `Ctrl+Shift+P` → "PascalLint: Lint Current File"
   - `Ctrl+Shift+P` → "PascalLint: Fix All Issues"

### 配置文件测试

在项目根目录创建 `.PascalLint.json`:
```json
{
  "rules": {
    "no-with": "error",
    "dangling-semicolon": "error",
    "use-free-and-nil": "warn",
    "empty-begin-end": "off"
  }
}
```

修改配置后，重新打开文件应该看到规则变化。

### 查看 Output 日志

如果插件不工作，查看日志：

1. 打开 Output Channel：
   - `Ctrl+Shift+P` → "Output: Show Output Channels"
   - 选择 "PascalLint"

2. 查看是否有错误信息：
   ```
   [2025-01-05T...] PascalLint activating...
   [2025-01-05T...] Linter initialized successfully
   ```

---

## 常见问题

### Q1: 安装后没有任何反应

**检查**：
1. 确认已安装 `alefragnani.pascal` 扩展
2. 重启 VSCode
3. 查看 Output Channel 是否有错误日志

### Q2: 打开 .pas 文件没有语法高亮

**原因**：缺少 Pascal 语言支持扩展

**解决**：安装 `alefragnani.pascal` 扩展

### Q3: 没有显示任何诊断信息

**检查**：
1. 确认文件后缀是 `.pas` (不是 `.txt`)
2. 查看 Output Channel 是否有 "PascalLint activated" 日志
3. 检查 `.PascalLint.json` 配置是否把所有规则都设为 `off`

### Q4: 报错 "Pascal grammar not found"

**原因**：WASM 文件路径错误或文件缺失

**解决**：
1. 卸载旧版本：`code --uninstall-extension pascallint.pascallint`
2. 重新安装最新版 .vsix

### Q5: Auto-fix 保存后不生效

**当前版本不支持自动保存修复**，需要手动执行：
- `Ctrl+Shift+P` → "PascalLint: Fix All Issues"

---

## 性能测试

测试大文件的 lint 性能：

```pascal
{ 创建一个 ~1000 行的 .pas 文件 }
unit LargeUnit;

interface

implementation

procedure Test;
begin
  // ... 大量代码 ...
end;

end.
```

查看 Output Channel 的日志，应该显示：
```
[2025-01-05T...] Warning: Lint took 120ms for /path/to/largeunit.pas
```

如果超过 500ms，说明性能需要优化。

---

## 多 Workspace 测试

1. 同时打开两个不同的项目：
   ```
   /ProjectA
     ├── .PascalLint.json (rules: strict)
     └── Unit1.pas

   /ProjectB
     ├── .PascalLint.json (rules: loose)
     └── Unit1.pas
   ```

2. 验证：
   - ProjectA 的文件应该按 strict 规则 lint
   - ProjectB 的文件应该按 loose 规则 lint
   - 修改 ProjectA 的配置，不应影响 ProjectB

---

## 卸载与重装

### 完全卸载

```bash
# 1. 卸载扩展
code --uninstall-extension pascallint.pascallint

# 2. 删除配置 (可选)
rm -rf ~/.vscode/extensions/pascallint*

# 3. 重新安装
code --install-extension pascallint-0.2.0.vsix
```

---

## 反馈渠道

如果遇到问题，请提供：
1. VSCode 版本：`code --version`
2. PascalLint 版本：`0.2.0`
3. Output Channel 日志
4. 复现步骤
