# 插件升级计划：个性化引导与 Material Design 重构

根据您的需求和市场调研结果，我们将对插件进行深度升级，重点在于**首次使用引导**、**Material Design 风格重构**以及**核心功能增强**。

## 1. 核心功能升级

### 1.1 首次使用引导 (Onboarding Flow)
当用户首次打开插件时，不再直接显示默认路径，而是进入“欢迎设置”流程：
*   **欢迎页**: 简洁友好的介绍界面。
*   **根目录选择**: 提供输入框或浏览按钮（调用后端 API 选择文件夹），让用户指定“资源根目录”。
*   **偏好记忆**: 将用户选择的路径存储在本地（`localStorage`），下次打开直接加载该目录。

### 1.2 路径导航增强
*   **交互式面包屑 (Interactive Breadcrumbs)**: 将顶部简单的路径文本改为可点击的面包屑导航（如 `C: > Users > Admin`），方便快速跳转上级目录。
*   **设置入口**: 在右上角添加设置齿轮图标，允许用户随时修改根目录。

## 2. UI/UX 重构 (Google Material Design)

我们将完全重写界面样式，使其与 Chrome 浏览器原生风格融为一体：

*   **设计语言**: 采用 **Google Material 3** 设计规范。
    *   **色彩**: 使用 Chrome 默认的蓝/白/灰配色体系，支持浅色/深色模式自动切换。
    *   **形状**: 按钮和卡片采用大圆角（Rounded Corners）。
    *   **图标**: 继续使用 `Lucide React` 但调整样式以匹配 Material Symbols，或引入更丰富的彩色文件图标。
    *   **动效**: 添加细腻的 Hover 状态和页面切换动画。

*   **布局优化**:
    *   **顶部栏 (App Bar)**: 包含面包屑、搜索按钮、设置按钮。
    *   **内容区**:
        *   **一级视图 (Grid)**: 卡片式设计，增加文件夹缩略图（如果有）或精美图标。
        *   **二级视图 (List)**: 增加文件类型图标，行高优化，悬停显示操作按钮。

## 3. 实现步骤

### 第一步：后端 API 增强 (Server)
*   **路径验证 API**: 增加 `POST /api/check-path`，用于在前端设置根目录时验证路径是否存在。

### 第二步：前端组件化与逻辑重构 (Extension)
*   **组件拆分**: 创建 `components/` 目录，拆分为 `WelcomeScreen` (引导页), `FileGrid` (网格视图), `FileList` (列表视图), `Breadcrumbs` (面包屑), `TopBar` (顶部栏)。
*   **状态管理**: 使用 React Context 或 Hook 管理 `rootPath` 和 `isFirstRun` 状态。

### 第三步：样式重写 (Tailwind + Material)
*   **配置 Tailwind**: 扩展 `tailwind.config.js`，添加 Material Design 推荐的颜色和阴影配置。
*   **样式应用**: 重写所有组件的 className，确保无“撕裂感”。

## 4. 目录结构预览

```text
extension/src/
├── components/
│   ├── WelcomeScreen.jsx   # 首次引导页
│   ├── TopBar.jsx          # 顶部导航栏（含面包屑）
│   ├── FileGrid.jsx        # 一级网格视图
│   └── FileList.jsx        # 二级/三级列表视图
├── hooks/
│   └── useFileSystem.js    # 封装 API 调用逻辑
├── App.jsx                 # 主逻辑入口
└── index.css               # 全局样式 (Material Theme)
```

我们将首先实现后端验证接口，然后着手前端的组件化重构和样式升级。
