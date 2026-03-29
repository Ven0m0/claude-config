---
name: linux-kernel-crash-debug
description: 使用 crash 工具调试 Linux 内核崩溃。当用户提到 kernel crash、kernel panic、vmcore 分析、内核转储调试、crash utility、内核 oops 调试、分析内核崩溃转储文件、使用 crash 命令、定位内核问题根因时，使用此 skill。
---

# Linux Kernel Crash Debugging

本 skill 指导如何使用 crash 工具分析 Linux 内核崩溃转储。

## 安装

### Claude Code
```bash
claude skill install linux-kernel-crash-debug.skill
```

### OpenClaw
```bash
# 方式一：通过 ClawHub 安装
clawhub install linux-kernel-crash-debug

# 方式二：手动安装
mkdir -p ~/.openclaw/workspace/skills/linux-kernel-crash-debug
cp SKILL.md ~/.openclaw/workspace/skills/linux-kernel-crash-debug/
```

## 快速开始

### 启动会话

```bash
# 分析转储文件
crash vmlinux vmcore

# 调试运行中的系统
crash vmlinux

# 原始 RAM 转储
crash vmlinux ddr.bin --ram_start=0x80000000
```

### 核心调试流程

```
1. crash> sys              # 确认 panic 原因
2. crash> log              # 查看内核日志
3. crash> bt               # 分析调用栈
4. crash> struct <type>    # 检查数据结构
5. crash> kmem <addr>      # 内存分析
```

## 前置要求

| 项目 | 要求 |
|------|------|
| **vmlinux** | 必须带 debug symbols (`CONFIG_DEBUG_INFO=y`) |
| **vmcore** | kdump/netdump/diskdump/ELF 格式 |
| **版本** | vmlinux 必须与 vmcore 内核版本完全匹配 |

获取 debuginfo：
```bash
# RHEL/CentOS
yum install kernel-debuginfo

# 自编译内核
make menuconfig  # 启用 CONFIG_DEBUG_INFO
```

## 核心命令速查

### 调试分析

| 命令 | 用途 | 示例 |
|------|------|------|
| `sys` | 系统信息/panic 原因 | `sys`, `sys -i` |
| `log` | 内核消息缓冲区 | `log`, `log \| tail` |
| `bt` | 调用栈回溯 | `bt`, `bt -a`, `bt -f` |
| `struct` | 结构体查看 | `struct task_struct <addr>` |
| `p/px/pd` | 打印变量 | `p jiffies`, `px current` |
| `kmem` | 内存分析 | `kmem -i`, `kmem -S <cache>` |

### 任务和进程

| 命令 | 用途 | 示例 |
|------|------|------|
| `ps` | 进程列表 | `ps`, `ps -m \| grep UN` |
| `set` | 切换上下文 | `set <pid>`, `set -p` |
| `foreach` | 批量任务操作 | `foreach bt`, `foreach UN bt` |
| `task` | task_struct 内容 | `task <pid>` |
| `files` | 打开的文件 | `files <pid>` |

### 内存操作

| 命令 | 用途 | 示例 |
|------|------|------|
| `rd` | 读取内存 | `rd <addr>`, `rd -p <phys>` |
| `search` | 搜索内存 | `search -k deadbeef` |
| `vtop` | 地址翻译 | `vtop <addr>` |
| `list` | 遍历链表 | `list task_struct.tasks -h <addr>` |

## bt 命令详解

最重要的调试命令：

```
crash> bt              # 当前任务调用栈
crash> bt -a           # 所有 CPU 活动任务
crash> bt -f           # 展开栈帧原始数据
crash> bt -F           # 符号化栈帧数据
crash> bt -l           # 显示源文件和行号
crash> bt -e           # 搜索异常帧
crash> bt -v           # 检查栈溢出
crash> bt -R <sym>     # 仅显示引用该符号的栈
crash> bt <pid>        # 指定进程
```

## 上下文管理

Crash 会话有一个"当前上下文"，影响 `bt`, `files`, `vm` 等命令：

```
crash> set              # 查看当前上下文
crash> set <pid>        # 切换到指定 PID
crash> set <task_addr>  # 切换到任务地址
crash> set -p           # 恢复到 panic 任务
```

## 会话控制

```
# 输出控制
crash> set scroll off   # 禁用分页
crash> sf               # scroll off 别名

# 输出重定向
crash> foreach bt > bt.all

# GDB 直通
crash> gdb bt           # 单次调用 gdb
crash> set gdb on       # 进入 gdb 模式
(gdb) info registers
(gdb) set gdb off

# 从文件读取命令
crash> < commands.txt
```

## 典型调试场景

### kernel BUG 定位

```
crash> sys                    # 确认 panic
crash> log | tail -50         # 查看日志
crash> bt                     # 调用栈
crash> bt -f                  # 展开栈帧获取参数
crash> struct <type> <addr>   # 检查数据结构
```

### 死锁分析

```
crash> bt -a                  # 所有 CPU 调用栈
crash> ps -m | grep UN        # 不可中断睡眠进程
crash> foreach UN bt          # 查看等待原因
crash> struct mutex <addr>    # 检查锁状态
```

### 内存问题

```
crash> kmem -i                # 内存统计
crash> kmem -S <cache>        # 检查 slab
crash> vm <pid>               # 进程内存映射
crash> search -k <pattern>    # 搜索内存
```

### 栈溢出

```
crash> bt -v                  # 检查栈溢出
crash> bt -r                  # 原始栈数据
```

## 高级技巧

### 链式查询

```
crash> bt -f                  # 获取指针
crash> struct file.f_dentry <addr>
crash> struct dentry.d_inode <addr>
crash> struct inode.i_pipe <addr>
```

### 批量检查 Slab

```
crash> kmem -S inode_cache | grep counter | grep -v "= 1"
```

### 遍历内核链表

```
crash> list task_struct.tasks -s task_struct.pid -h <start>
crash> list -h <addr> -s dentry.d_name.name
```

## 扩展参考

详细信息请查阅以下参考文件：

| 文件 | 内容 |
|------|------|
| `references/advanced-commands.md` | 高级命令详解：list, rd, search, vtop, kmem, foreach |
| `references/vmcore-format.md` | vmcore 文件格式、ELF 结构、VMCOREINFO |
| `references/case-studies.md` | 详细调试案例：kernel BUG、死锁、OOM、NULL指针、栈溢出 |

使用方式：
```
crash> help <command>        # 内置帮助
# 或在 Claude 中请求查看参考文件
```

## 常见错误

```
crash: vmlinux and vmcore do not match!
# → 确保 vmlinux 版本与 vmcore 完全匹配

crash: cannot find booted kernel
# → 明确指定 vmlinux 路径

crash: cannot resolve symbol
# → 检查 vmlinux 是否带 debug symbols
```

## 注意事项

1. **版本匹配**: vmlinux 必须与 vmcore 内核版本完全匹配
2. **调试信息**: 必须使用带 debug symbols 的 vmlinux
3. **上下文意识**: `bt`, `files`, `vm` 等命令受当前上下文影响
4. **活系统修改**: `wr` 命令会修改运行中的内核，极其危险

## 资源

- [Crash Utility Whitepaper](https://crash-utility.github.io/crash_whitepaper.html)
- [Crash Utility Documentation](https://crash-utility.github.io/)
- [Crash Help Pages](https://crash-utility.github.io/help_pages/)

## 贡献

这是一个开源项目，欢迎贡献！

- **GitHub 仓库**: https://github.com/crazyss/linux-kernel-crash-debug
- **报告问题**: [GitHub Issues](https://github.com/crazyss/linux-kernel-crash-debug/issues)
- **提交 PR**: 欢迎提交 Pull Request，包括 bug 修复、新功能或文档改进

详见 [CONTRIBUTING.md](https://github.com/crazyss/linux-kernel-crash-debug/blob/main/CONTRIBUTING.md)。