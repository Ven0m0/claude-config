# Linux Kernel Crash Debug Skill

[English](README.md) | 中文

欢迎使用 **Linux Kernel Crash Debug Skill**！这是一个用于 Claude Code 的技能，帮助你使用 crash 工具调试 Linux 内核崩溃。

## 功能特性

- **快速入门指南**：核心命令和调试流程
- **完整命令参考**：所有 crash utility 命令及示例
- **高级技巧**：内存分析、链表遍历、地址翻译
- **实战案例**：kernel BUG、死锁、OOM、NULL 指针、栈溢出
- **vmcore 知识**：ELF 格式、VMCOREINFO、转储文件类型

## 安装

```bash
# 克隆仓库
git clone https://github.com/crazyss/linux-kernel-crash-debug.git

# 在 Claude Code 中安装
claude skill install linux-kernel-crash-debug.skill
```

## 快速开始

```bash
# 启动 crash 会话
crash vmlinux vmcore

# 基本调试流程
crash> sys              # 查看 panic 原因
crash> log              # 查看内核日志
crash> bt               # 调用栈回溯
crash> struct <type>    # 检查数据结构
crash> kmem <addr>      # 内存分析
```

## 目录结构

```
linux-kernel-crash-debug/
├── SKILL.md                    # 主技能文件（英文）
├── SKILL_CN.md                 # 主技能文件（中文）
├── README.md                   # 英文文档
├── README_CN.md                # 中文文档
├── CONTRIBUTING.md             # 贡献指南
├── LICENSE                     # MIT 许可证
├── linux-kernel-crash-debug.skill  # 打包的技能文件
└── references/                 # 详细文档
    ├── advanced-commands.md    # 高级命令详解
    ├── vmcore-format.md        # vmcore 文件格式
    └── case-studies.md         # 实战调试案例
```

## 使用方法

当你在 Claude Code 中提及以下内容时，此技能会自动触发：
- kernel crash / kernel panic
- vmcore 分析
- crash utility
- kernel oops 调试
- 内核崩溃调试

## 参与贡献

欢迎参与贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

- 通过 [Issues](https://github.com/crazyss/linux-kernel-crash-debug/issues) 报告问题或请求功能
- 通过 Pull Requests 提交改进

## 资源链接

- [Crash Utility 白皮书](https://crash-utility.github.io/crash_whitepaper.html)
- [Crash Utility 文档](https://crash-utility.github.io/)
- [Crash 帮助页面](https://crash-utility.github.io/help_pages/)

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

Made with passion for Linux kernel debugging