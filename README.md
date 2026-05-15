# ContextPilot

**给 AI 编程助手配一个"外部记事本"，让它在长项目里不会越聊越笨。**

---

## 这是什么

ContextPilot 是一个极简的 CLI 工具。它做了大量 AI 编程助手（Claude Code、Cursor、Codex、DeepSeek Coder）共同的痛点：

> AI 很能写代码，但项目一长，它就开始忘记之前的设计决策、重复读文件、新会话要重新解释背景。

ContextPilot 的思路是：**不给 AI 增加记忆，而是给它一个看得见、改得动的项目文件夹。**

你把项目状态写成结构化文件，每次新会话让 AI 先读这些文件，就能无缝衔接。

---

## 和内置 Skill / 上下文管理有什么区别

很多人会问：Claude Code 已经有 skills、hooks、memory，为什么还要这个？

| | Claude Code Skill / Memory | ContextPilot |
|---|---|---|
| **适用工具** | 只对 Claude Code 有效 | Claude Code、Cursor、Codex、DeepSeek 都能用 |
| **存储位置** | 工具内部，黑盒管理 | `.contextpilot/` 文件夹，纯 Markdown + JSON |
| **可读性** | 你很难直接查看和编辑 | 任何文本编辑器都能打开 |
| **跨会话流转** | 依赖工具自身的记忆机制 | 文件在磁盘上，永远不会丢 |
| **版本控制** | 不能 git | 可以直接 `git commit`，团队共享 |
| **AI 透明度** | AI 被动依赖系统注入 | AI 主动读取文件，知道自己在看什么 |

**一句话：Skill/Memory 是"工具替你管"，ContextPilot 是"你管，AI 配合你"。**

工具内置的记忆机制会随着版本更新、配置变化而改变行为。ContextPilot 就是一堆 Markdown 文件 —— 只要文件系统还在，它就能工作。

---

## 怎么用（30 秒上手）

```bash
# 1. 安装
cd contextpilot && npm link

# 2. 在你的项目里初始化
cd ~/my-project
contextpilot init
# → 创建 .contextpilot/ 目录，里面有 project.md、progress.md、tasks.json 等
```

### 日常使用就三件事：

**开始干活时** — 让 AI 读项目记忆：
> "先读 `.contextpilot/project.md` 和 `.contextpilot/progress.md`，然后开始工作。"

**干活过程中** — 更新进度（手动或让 AI 帮你写）：
> "把刚才完成的 Task CRUD 端点更新到 `.contextpilot/progress.md` 的 Completed 里。"

**上下文快满 / 开新会话时** — 存档 + 恢复：
```bash
contextpilot checkpoint   # 保存当前状态快照
contextpilot resume       # 生成给新会话的提示词，粘贴给 AI
```

就这么简单。它就是帮你记住"项目做到哪了"、"为什么当时这么设计"、"下一步该做什么"。

---

## 五个命令

| 命令 | 作用 |
|------|------|
| `contextpilot init` | 创建 `.contextpilot/` 目录和模板 |
| `contextpilot status` | 看当前进度：多少任务做完了，卡在哪 |
| `contextpilot checkpoint` | 打包当前状态→快照文件 |
| `contextpilot resume` | 生成恢复提示词，新会话粘贴给 AI |
| `contextpilot plan` | 看下一步能做哪些任务（自动检查依赖） |

---

## 项目记忆里有什么

```
.contextpilot/
├── project.md       # 项目概述、技术栈、架构
├── progress.md      # 当前进度：已完成 / 进行中 / 阻塞
├── decisions.md     # 设计决策记录（为什么选 JWT 而不是 Session）
├── tasks.json       # 任务列表 + 依赖关系
├── agents.md        # 多 Agent 配置
├── rules.md         # 上下文预算规则（超过 60% 触发存档）
└── checkpoints/     # 时间戳快照
```

全部是纯文本 —— Markdown 和 JSON，任何工具都能读。

---

## 为什么做这个项目

AI 编程助手在短任务里表现极好，但在持续数周的项目里会"衰减"：
- 上下文窗口被历史对话塞满，新指令被稀释
- 每次新会话都要人工重新解释项目背景
- 做完的决策没有沉淀，下次可能重蹈覆辙
- 多个 Agent 的结论散落在不同会话里

ContextPilot 把"项目记忆"从 AI 的黑盒里拿出来，放回你手里。**工具会变，文件不会。**

---

## 开发

```bash
npm install
npm run dev          # tsx 热加载
npm test             # vitest 跑测试 (52 个用例)
npm run coverage     # 覆盖率报告 (90%+)
npm run build        # tsup 生产构建
npm run typecheck    # TypeScript 类型检查
```
