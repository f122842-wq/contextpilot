# ContextPilot

**给 AI 编程助手配一个"外部记事本"，长项目里不会越聊越笨。**

---

## 这是什么

AI 编程助手在短任务里很强，但项目一长就会：
- 忘记之前的设计决策，重复踩坑
- 新会话要你重新解释半天背景
- 上下文窗口被历史对话塞满，回答质量下降

ContextPilot 的思路：**把项目状态写成 `.contextpilot/` 文件夹里的纯文本文件，AI 每次会话先读这些文件，就能无缝衔接。**

---

## 安装

```bash
cd contextpilot && npm link
```

---

## 两种使用场景

这个工具有两类操作：

| 类型 | 在哪里用 | 做什么 |
|------|---------|--------|
| **终端命令** | 你自己在终端跑 | 初始化项目记忆、快速存档 |
| **AI 指令** | 粘贴给 AI / AI 自己执行 | 读取记忆、更新进度、遵守规则 |

---

## 一、终端命令（你对项目文件操作）

### 初始化：`contextpilot init`

```bash
# 基础版 — 创建空白模板（适合新项目）
cd ~/my-project
contextpilot init

# 聪明版 — 自动扫描项目，生成有内容的记忆（适合已开工的项目）
contextpilot init --scan

# 读 git 历史，自动填"已完成"进度
contextpilot init --scan --from-git

# 自定义上下文阈值（默认 60%）
contextpilot init --threshold 80

# 覆盖已有文件
contextpilot init --scan --force
```

### 日常使用：`contextpilot snapshot`

```bash
# 一键快照 — 把当前所有项目记忆打包成一个文件
contextpilot snapshot
# 输出：.contextpilot/checkpoints/2026-05-16-16-30-00.md
```

其他查看命令：

```bash
contextpilot status    # 看当前进度
contextpilot plan      # 看下一步能做什么
contextpilot resume    # 生成"恢复提示词"，新会话粘贴给 AI
```

---

## 二、AI 指令（在智能体中使用）

### 每次新会话开头 — 让 AI 读项目记忆

直接粘贴这段话给 AI：

> 在开始工作之前，请先阅读以下文件了解项目状态：
> - `.contextpilot/project.md` — 项目概述和技术栈
> - `.contextpilot/progress.md` — 当前进度
> - `.contextpilot/decisions.md` — 设计决策
> - `.contextpilot/tasks.json` — 任务列表
> - `.contextpilot/checkpoints/` 中最新的快照文件

或者更简单，直接用 resume 生成的提示词：

```bash
contextpilot resume
# 把输出直接粘贴给 AI 新会话
```

### 干活过程中 — 让 AI 更新记忆

随时对 AI 说：

> "把刚才完成的任务更新到 `.contextpilot/progress.md` 的 Completed 里，然后把 `.contextpilot/tasks.json` 里对应任务标为 done。"

> "这个设计决策很重要，记录到 `.contextpilot/decisions.md`。"

### 上下文快满时 — 存档 + 开新会话

当 AI 开始"变笨"时（比如 Claude 上下文用了 70% 以上），对 AI 说：

> "上下文快满了，先更新 `.contextpilot/progress.md` 和 `.contextpilot/tasks.json`，然后运行 `contextpilot snapshot` 存档。我开新会话用 `contextpilot resume` 继续。"

开新会话后：

```bash
contextpilot resume | pbcopy   # macOS
contextpilot resume | clip     # Windows
# 粘贴给新会话的 AI
```

---

## 项目记忆里有什么

```
.contextpilot/
├── project.md       # 项目概述、技术栈、架构
├── progress.md      # 当前进度：已完成 / 进行中 / 阻塞
├── decisions.md     # 设计决策记录
├── tasks.json       # 任务列表 + 依赖关系
├── agents.md        # Agent 配置
├── rules.md         # AI 行为规则（上下文预算等）
└── checkpoints/     # 快照存档
```

全部是纯文本 — Markdown 和 JSON。可以 `git commit`，可以团队共享。

---

## 和 Claude Code 内置记忆的区别

| | Claude Code Memory | ContextPilot |
|---|---|---|
| **适用范围** | 仅 Claude Code | Claude Code、Cursor、Codex、DeepSeek 都能用 |
| **存储位置** | 工具内部黑盒 | `.contextpilot/` 文件夹，你完全掌控 |
| **版本控制** | 不能 git | 可以直接 git commit |
| **透明度** | AI 被动依赖系统注入 | AI 主动读取文件，知道自己在看什么 |
| **跨工具** | 换工具就没了 | 文件在磁盘上，永远在 |

**一句话：内置记忆是"工具替你管"，ContextPilot 是"你管，AI 配合你"。**
