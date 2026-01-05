# 版本维护与插件上架

## 1. 版本策略 (Versioning)

遵循 **Semantic Versioning 2.0.0** (语义化版本)。

*   **Major (主版本)**: 不兼容的 API 修改（如配置文件格式大改）。
*   **Minor (次版本)**: 向下兼容的功能性新增（如新增规则）。
*   **Patch (修订号)**: 向下兼容的问题修正。

### 0.x 阶段
在 `1.0.0` 发布前，次版本号变更可能包含破坏性更新，但尽量保持兼容。

## 2. 发布流程 (Release Workflow)

### 2.1 准备发布
1.  更新 `package.json` 版本号。
2.  更新 `CHANGELOG.md`。
3.  打 Tag：`git tag v0.x.x`。

### 2.2 打包 (Packaging)
使用 `vsce` (VSCode Extension Manager) 进行打包。

```bash
# 安装 vsce
npm install -g @vscode/vsce

# 打包为 .vsix 文件 (用于测试或离线安装)
vsce package
```

### 2.3 自动化发布 (CI/CD)
本项目配置 GitHub Actions 自动发布（待实现）。
*   Push Tag -> Build -> Test -> Publish to Marketplace & NPM。

## 3. 分发渠道

### 3.1 VSCode Marketplace
*   **Publisher**: (需注册 Microsoft Publisher ID)
*   **发布命令**: `vsce publish`
*   **必要元数据**:
    *   `icon.png`: 128x128 插件图标。
    *   `README.md`: 详细的使用说明。
    *   `LICENSE`: 开源协议。

### 3.2 Open VSX Registry
用于支持 VSCodium 等开源 IDE。

```bash
npx ovsx publish
```

### 3.3 NPM (Core Library)
发布 `pslint` CLI 工具和核心库。

```bash
npm publish --access public
```

## 4. 维护计划

*   **Issue 响应**: 优先处理 Crash 和误报 (False Positive)。
*   **Roadmap 更新**: 每个次版本发布后更新技术路线图。
*   **社区互动**: 积极回应 GitHub Discussions。
