# Tree-sitter 使用指南

本文档介绍如何在 PascalLint 中使用 Tree-sitter。

---

## 什么是 Tree-sitter？

[Tree-sitter](https://tree-sitter.github.io/) 是一个 **增量解析器生成器**:

- 🚀 **快速**: 增量解析，只重新解析改变的部分
- 🎯 **准确**: 生成精确的 AST
- 🔌 **跨语言**: 支持 50+ 语言
- 📦 **WASM**: 可在浏览器/Node.js 中运行

---

## 基本概念

### AST (抽象语法树)

源代码被解析为树形结构：

```pascal
procedure Test;     // 解析为:
begin               //
  x := 1;           // defProc
end;                //   ├── declProc
                    //   │     ├── kProcedure
                    //   │     ├── identifier "Test"
                    //   │     └── ;
                    //   └── block
                    //         ├── kBegin
                    //         ├── statement "x := 1"
                    //         └── kEnd
```

### SyntaxNode

每个 AST 节点是一个 `SyntaxNode`:

```typescript
interface SyntaxNode {
    type: string;           // 节点类型, 如 'block', 'with'
    text: string;           // 节点文本
    startPosition: Point;   // 起始位置 {row, column}
    endPosition: Point;     // 结束位置
    startIndex: number;     // 起始字节偏移
    endIndex: number;       // 结束字节偏移
    children: SyntaxNode[]; // 子节点
    namedChildren: SyntaxNode[]; // 命名子节点
    parent: SyntaxNode | null;
}
```

---

## 在 PascalLint 中使用

### 初始化解析器

```typescript
import Parser from 'web-tree-sitter';

// 1. 初始化 WASM
await Parser.init();

// 2. 创建解析器
const parser = new Parser();

// 3. 加载语言
const language = await Parser.Language.load('tree-sitter-pascal.wasm');
parser.setLanguage(language);
```

### 解析代码

```typescript
// 完全解析
const tree = parser.parse(sourceCode);

// 访问根节点
console.log(tree.rootNode.type); // 'program' 或 'root'
console.log(tree.rootNode.text); // 完整源码
```

### 增量解析

当文件有小改动时，增量解析更快：

```typescript
// 告诉树发生了什么改变
tree.edit({
    startIndex: 10,      // 改变开始位置
    oldEndIndex: 15,     // 旧内容结束位置
    newEndIndex: 20,     // 新内容结束位置
    startPosition: { row: 1, column: 5 },
    oldEndPosition: { row: 1, column: 10 },
    newEndPosition: { row: 1, column: 15 },
});

// 用旧树做增量解析
const newTree = parser.parse(newSourceCode, tree);
```

### 遍历 AST

```typescript
function traverse(node: SyntaxNode) {
    console.log(node.type, node.text.substring(0, 20));
    
    for (const child of node.children) {
        traverse(child);
    }
}

traverse(tree.rootNode);
```

---

## Pascal 常见节点类型

### tree-sitter-pascal (Isopod 版本)

| 节点类型 | 描述 | 示例 |
|:---|:---|:---|
| `root` / `program` | 根节点 | |
| `unit` | unit 声明 | `unit MyUnit;` |
| `interface` | interface 部分 | |
| `implementation` | implementation 部分 | |
| `declProc` / `defProc` | 过程/函数声明 | |
| `block` | begin...end | `begin ... end` |
| `with` | with 语句 | `with obj do ...` |
| `if` | if 语句 | `if x then ...` |
| `for` | for 循环 | `for i := 1 to 10 do` |
| `while` | while 循环 | `while x do ...` |
| `try` | try 块 | `try ... except/finally` |
| `statement` | 语句 | `x := 1;` |
| `identifier` | 标识符 | `MyVar` |
| `kBegin`, `kEnd` | 关键字 | `begin`, `end` |
| `kIf`, `kThen`, `kElse` | if 关键字 | |
| `comment` | 注释 | `// comment`, `{ ... }` |

### 调试 AST

使用 debug-ast.js 查看实际结构：

```bash
node ./out/debug-ast.js yourfile.pas
```

输出：

```
root [0:0] "unit MyUnit;..."
  unit [0:0] "unit MyUnit;..."
    kUnit [0:0] "unit"
    moduleName [0:5] "MyUnit"
      identifier [0:5] "MyUnit"
    ; [0:11] ";"
    ...
```

---

## 内存管理

### ⚠️ 重要: 释放 Tree

Tree-sitter WASM 使用独立的内存，必须手动释放：

```typescript
// ❌ 错误: 内存泄漏
function lint(code: string) {
    const tree = parser.parse(code);
    // ... 使用 tree
    // 没有 delete! 内存泄漏
}

// ✅ 正确: 显式释放
function lint(code: string) {
    const tree = parser.parse(code);
    try {
        // ... 使用 tree
    } finally {
        tree.delete(); // 释放 WASM 内存
    }
}
```

PascalLint 的处理方式：

```typescript
// src/linter/linter-service.ts
private treeCache = new Map<string, { tree: Parser.Tree; content: string }>();

// 内容改变时释放旧 tree
if (cached && cached.content !== newContent) {
    cached.tree.delete(); // ✅ 释放
}

// 清理时释放所有
cleanup() {
    for (const { tree } of this.treeCache.values()) {
        tree.delete();
    }
    this.treeCache.clear();
}
```

---

## 常见问题

### Q: 如何获取 tree-sitter-pascal.wasm？

A: 自行编译：

```bash
# 1. 安装 CLI
npm install -g tree-sitter-cli

# 2. 克隆语法
git clone https://github.com/Isopod/tree-sitter-pascal.git
cd tree-sitter-pascal

# 3. 编译 WASM
tree-sitter build --wasm

# 4. 复制到项目
cp tree-sitter-pascal.wasm /path/to/PascalLint/parsers/
```

### Q: 节点类型不匹配怎么办？

A: 不同的 tree-sitter-pascal 版本可能有不同的节点类型。使用 debug-ast.js 查看实际类型，然后更新规则。

### Q: 如何处理语法错误？

A: Tree-sitter 是容错的，即使有语法错误也会返回 AST：

```typescript
const tree = parser.parse('procedure incomplete');
if (tree.rootNode.hasError()) {
    console.log('有语法错误');
}
```

---

## 参考资源

- [Tree-sitter 官方文档](https://tree-sitter.github.io/tree-sitter/)
- [web-tree-sitter npm](https://www.npmjs.com/package/web-tree-sitter)
- [tree-sitter-pascal GitHub](https://github.com/Isopod/tree-sitter-pascal)
