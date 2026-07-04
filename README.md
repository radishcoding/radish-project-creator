# radish-project-creator 🌱

一个基于 Node.js + TypeScript 的交互式命令行脚手架。通过多级菜单选择编程语言与项目类型, 一键生成标准化的项目模板。

## ✨ 特性

- 🎨 精美交互: 基于 @clack/prompts, 启动带 figlet + 渐变 banner, 全程 spinner 与进度反馈。
- 🧭 向导式流程: 输入项目名 -> 选择语言 -> 选择模板 -> 一键生成。
- 🧩 约定式模板: 往 `templates/` 按目录约定放模板即可被自动发现, 无需改动脚手架代码。
- 🛡️ 生产级健壮性: 原子化生成 (先写临时目录再原子移动), 任一步失败自动回滚, 绝不留半成品。
- 🚦 优雅关闭: 捕获 SIGINT/SIGTERM 与未处理异常, 统一清理临时目录并恢复光标。
- 📦 包管理器感知: 自动探测 npm/pnpm/yarn/bun, 可选生成后自动安装依赖。

## 📋 环境要求

- Node.js >= 18

## 🚀 使用

发布后可直接用 npx (无需全局安装):

```bash
npx radish-project-creator
```

或全局安装:

```bash
npm install -g radish-project-creator
radish-creator
```

### 交互式 (推荐)

```bash
radish-creator
```

依次: 输入项目名称 -> 选择编程语言 -> 选择模板 -> 是否安装依赖 -> 完成。

### 参数式 (可跳过部分或全部交互)

```bash
# 指定名称与模板, 不安装依赖
radish-creator my-app --template typescript/node-basic --no-install

# 指定包管理器并自动安装
radish-creator my-app -t typescript/node-basic --pm pnpm --install

# 目标目录非空时强制覆盖
radish-creator my-app -t typescript/node-basic --force
```

### 命令行选项

| 选项                         | 说明                                         |
| ---------------------------- | -------------------------------------------- |
| `[project-name]`             | 项目名称 (位置参数); 省略则交互询问          |
| `-t, --template <lang/id>`   | 指定模板, 如 `typescript/node-basic`         |
| `--pm <manager>`             | 包管理器: `npm` \| `pnpm` \| `yarn` \| `bun` |
| `--install` / `--no-install` | 是否生成后安装依赖 (默认交互询问)            |
| `--force`                    | 目标目录非空时强制覆盖                       |
| `--no-banner`                | 跳过启动 banner                              |
| `-y, --yes`                  | 接受默认值, 尽量非交互                       |
| `-v, --version`              | 输出版本号                                   |
| `-h, --help`                 | 显示帮助                                     |

规则: 参数已给定的值优先; 未给定的值由交互兜底补齐。项目名遵循 npm 包名规范 (小写, 无空格, URL 友好字符)。

## 🧩 如何添加一个模板

这是脚手架的核心扩展点。模板按约定放在包根的 `templates/` 目录下, **无需改动任何脚手架代码**, 启动时会自动扫描发现。

### 1. 目录结构约定

```
templates/
  <语言>/            # 一级: 编程语言, 如 typescript / python / go
    <模板 id>/       # 二级: 模板标识, 如 node-basic / express-api
      meta.json      # 模板元信息 (必需)
      <项目文件...>   # 一套可直接运行的真实项目
```

菜单的两级选择正对应这两级目录: 一级选语言, 二级选该语言下的模板。模板的唯一标识 (slug) 即 `<语言>/<模板 id>`, 也就是 `--template` 要传的值。

### 2. 编写 meta.json

```json
{
  "name": "Node + TypeScript 基础",
  "description": "最小可运行的 Node.js + TypeScript 项目",
  "emoji": "📦",
  "tags": ["node", "typescript"]
}
```

| 字段          | 必需 | 说明                            |
| ------------- | ---- | ------------------------------- |
| `name`        | 是   | 菜单中显示的模板名              |
| `description` | 是   | 菜单中的一行描述 (显示为 hint)  |
| `emoji`       | 否   | 菜单项前缀图标; 省略则用默认 📦 |
| `tags`        | 否   | 标签数组, 供后续检索/分类       |

### 3. 放入项目文件

模板目录里就是一套**可直接运行的真实项目** (原样拷贝到目标)。生成时脚手架会做三件定向处理:

- **删除 `meta.json`**: 它只是脚手架元信息, 不会进入生成的项目。
- **替换 `package.json` 的 `name`**: 若模板含 `package.json`, 其 `name` 字段会被自动改为用户输入的项目名 (模板里放占位值即可)。
- **还原点文件**: 见下条。

### 4. 点文件必须用下划线前缀存储

npm 在发布时会过滤/改写某些点文件 (例如 `.gitignore` 会被处理), 导致它们无法随包一起分发。因此**模板里的点文件一律以 `_` 前缀存储, 生成时脚手架自动去掉前缀还原**。文件与目录都适用:

| 模板中存储为      | 生成后还原为    |
| ----------------- | --------------- |
| `_gitignore`      | `.gitignore`    |
| `_npmrc`          | `.npmrc`        |
| `_editorconfig`   | `.editorconfig` |
| `_github/` (目录) | `.github/`      |
| `_vscode/` (目录) | `.vscode/`      |

### 5. 完整示例: 新增一个 `typescript/express-api` 模板

```bash
# 1. 建目录
mkdir -p templates/typescript/express-api/src

# 2. 写 meta.json
#    { "name": "Express API", "description": "基于 Express 的 REST API 起手式",
#      "emoji": "🚀", "tags": ["node", "typescript", "express"] }

# 3. 放入项目文件: package.json (name 用占位值) / tsconfig.json /
#    src/index.ts / _gitignore / _npmrc / README.md ...
```

完成后无需重新构建 (开发时用 `npm run dev` 直接读 `src/` 与 `templates/`); 再次运行脚手架, 菜单里就会出现 Express API 这一项。发布到 npm 时, `templates/` 会随包一起打包 (见 `package.json` 的 `files` 字段)。

## 🏗️ 项目结构

```
src/
  index.ts / cli.ts        # 入口 + commander 参数解析与装配
  types.ts / constants.ts  # 共享类型 + templates 根路径解析
  core/                    # 纯业务逻辑 (无 TTY 依赖, 可独立测试)
    createProject          # 主编排流程
    templateRegistry       # 扫描 templates/ + 解析 meta.json
    templateGenerator      # 原子化生成 + 定向修补 + 失败回滚
    projectName / targetDir / packageManager / installer
  ui/                      # 基于 clack 的交互与呈现
    banner / prompts / reporter / theme / nextSteps
  runtime/                 # 运行时基础设施
    lifecycle              # 优雅关闭: 信号/异常/清理注册
    errors                 # 带 cause 的分层错误体系
templates/                 # 内置模板 (随包发布)
```

## 🛠️ 开发

```bash
npm install          # 安装依赖
npm run dev -- my-app -t typescript/node-basic   # 用 tsx 直接跑源码 (免构建)
npm run build        # tsc 编译到 dist/
npm start            # 运行编译产物
npm run typecheck    # 仅类型检查 (含测试)
npm test             # 运行测试 (vitest)
npm run test:watch   # 监听模式
npm run lint         # Biome 检查
npm run format       # Biome 格式化
```

本地把它当作真实命令测试:

```bash
npm run build
npm link             # 全局挂载 radish-creator 命令
# ... 在任意目录用 radish-creator 测试 ...
npm rm -g radish-project-creator   # 用完解绑
```

## 📄 License

[ISC](./LICENSE) © radishcoding-art
