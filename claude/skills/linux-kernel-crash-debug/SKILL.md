---
name: linux-kernel-crash-debug
description: Debug Linux kernel crashes using the crash utility. Use when users mention kernel crash, kernel panic, vmcore analysis, kernel dump debugging, crash utility, kernel oops debugging, analyzing kernel crash dump files, using crash commands, or locating root causes of kernel issues.
requires:
  - crash
  - gdb
  - readelf
  - objdump
  - makedumpfile
---

# Linux Kernel Crash Debugging

This skill guides you through analyzing Linux kernel crash dumps using the crash utility.

## Installation

### Claude Code
```bash
claude skill install linux-kernel-crash-debug.skill
```

### OpenClaw
```bash
# Method 1: Install via ClawHub
clawhub install linux-kernel-crash-debug

# Method 2: Manual installation
mkdir -p ~/.openclaw/workspace/skills/linux-kernel-crash-debug
cp SKILL.md ~/.openclaw/workspace/skills/linux-kernel-crash-debug/
```

## Quick Start

### Starting a Session

```bash
# Analyze a dump file
crash vmlinux vmcore

# Debug a running system
crash vmlinux

# Raw RAM dump
crash vmlinux ddr.bin --ram_start=0x80000000
```

### Core Debugging Workflow

```
1. crash> sys              # Confirm panic reason
2. crash> log              # View kernel log
3. crash> bt               # Analyze call stack
4. crash> struct <type>    # Inspect data structures
5. crash> kmem <addr>      # Memory analysis
```

## Prerequisites

| Item | Requirement |
|------|-------------|
| **vmlinux** | Must have debug symbols (`CONFIG_DEBUG_INFO=y`) |
| **vmcore** | kdump/netdump/diskdump/ELF format |
| **Version** | vmlinux must exactly match the vmcore kernel version |

### Package Installation

#### Anolis OS / Alibaba Cloud Linux

```bash
# Install crash utility
sudo dnf install crash

# Install kernel debuginfo (match your kernel version)
sudo dnf install kernel-debuginfo-$(uname -r)

# Install additional analysis tools
sudo dnf install gdb readelf objdump makedumpfile

# Optional: Install kernel-devel for source code reference
sudo dnf install kernel-devel-$(uname -r)
```

#### RHEL / CentOS / Rocky / AlmaLinux

```bash
sudo dnf install crash kernel-debuginfo-$(uname -r)
sudo dnf install gdb binutils makedumpfile
```

#### Ubuntu / Debian

```bash
sudo apt install crash linux-crashdump gdb binutils makedumpfile
sudo apt install linux-image-$(uname -r)-dbgsym
```

### Self-compiled Kernel

```bash
# Enable debug symbols in kernel config
make menuconfig  # Enable CONFIG_DEBUG_INFO, CONFIG_DEBUG_INFO_REDUCED=n

# Or set directly
scripts/config --enable CONFIG_DEBUG_INFO
scripts/config --enable CONFIG_DEBUG_INFO_DWARF_TOOLCHAIN_DEFAULT
```

### Verify Installation

```bash
# Check crash version
crash --version

# Verify debuginfo matches kernel
crash /usr/lib/debug/lib/modules/$(uname -r)/vmlinux /proc/kcore
```

## Core Command Reference

### Debugging Analysis

| Command | Purpose | Example |
|---------|---------|---------|
| `sys` | System info/panic reason | `sys`, `sys -i` |
| `log` | Kernel message buffer | `log`, `log \| tail` |
| `bt` | Stack backtrace | `bt`, `bt -a`, `bt -f` |
| `struct` | View structures | `struct task_struct <addr>` |
| `p/px/pd` | Print variables | `p jiffies`, `px current` |
| `kmem` | Memory analysis | `kmem -i`, `kmem -S <cache>` |

### Tasks and Processes

| Command | Purpose | Example |
|---------|---------|---------|
| `ps` | Process list | `ps`, `ps -m \| grep UN` |
| `set` | Switch context | `set <pid>`, `set -p` |
| `foreach` | Batch task operations | `foreach bt`, `foreach UN bt` |
| `task` | task_struct contents | `task <pid>` |
| `files` | Open files | `files <pid>` |

### Memory Operations

| Command | Purpose | Example |
|---------|---------|---------|
| `rd` | Read memory | `rd <addr>`, `rd -p <phys>` |
| `search` | Search memory | `search -k deadbeef` |
| `vtop` | Address translation | `vtop <addr>` |
| `list` | Traverse linked lists | `list task_struct.tasks -h <addr>` |

## bt Command Details

The most important debugging command:

```
crash> bt              # Current task stack
crash> bt -a           # All CPU active tasks
crash> bt -f           # Expand stack frame raw data
crash> bt -F           # Symbolic stack frame data
crash> bt -l           # Show source file and line number
crash> bt -e           # Search for exception frames
crash> bt -v           # Check stack overflow
crash> bt -R <sym>     # Only show stacks referencing symbol
crash> bt <pid>        # Specific process
```

## Context Management

Crash session has a "current context" affecting `bt`, `files`, `vm` commands:

```
crash> set              # View current context
crash> set <pid>        # Switch to specified PID
crash> set <task_addr>  # Switch to task address
crash> set -p           # Restore to panic task
```

## Session Control

```
# Output control
crash> set scroll off   # Disable pagination
crash> sf               # Alias for scroll off

# Output redirection
crash> foreach bt > bt.all

# GDB passthrough
crash> gdb bt           # Single gdb invocation
crash> set gdb on       # Enter gdb mode
(gdb) info registers
(gdb) set gdb off

# Read commands from file
crash> < commands.txt
```

## Typical Debugging Scenarios

### Kernel BUG Location

```
crash> sys                    # Confirm panic
crash> log | tail -50         # View logs
crash> bt                     # Call stack
crash> bt -f                  # Expand frames for parameters
crash> struct <type> <addr>   # Inspect data structures
```

### Deadlock Analysis

```
crash> bt -a                  # All CPU call stacks
crash> ps -m | grep UN        # Uninterruptible processes
crash> foreach UN bt          # View waiting reasons
crash> struct mutex <addr>    # Inspect lock state
```

### Memory Issues

```
crash> kmem -i                # Memory statistics
crash> kmem -S <cache>        # Inspect slab
crash> vm <pid>               # Process memory mapping
crash> search -k <pattern>    # Search memory
```

### Stack Overflow

```
crash> bt -v                  # Check stack overflow
crash> bt -r                  # Raw stack data
```

## Advanced Techniques

### Chained Queries

```
crash> bt -f                  # Get pointers
crash> struct file.f_dentry <addr>
crash> struct dentry.d_inode <addr>
crash> struct inode.i_pipe <addr>
```

### Batch Slab Inspection

```
crash> kmem -S inode_cache | grep counter | grep -v "= 1"
```

### Kernel Linked List Traversal

```
crash> list task_struct.tasks -s task_struct.pid -h <start>
crash> list -h <addr> -s dentry.d_name.name
```

## Extended Reference

For detailed information, refer to the following reference files:

| File | Content |
|------|---------|
| `references/advanced-commands.md` | Advanced commands: list, rd, search, vtop, kmem, foreach |
| `references/vmcore-format.md` | vmcore file format, ELF structure, VMCOREINFO |
| `references/case-studies.md` | Detailed debugging cases: kernel BUG, deadlock, OOM, NULL pointer, stack overflow |

Usage:
```
crash> help <command>        # Built-in help
# Or ask Claude to view reference files
```

## Common Errors

```
crash: vmlinux and vmcore do not match!
# -> Ensure vmlinux version exactly matches vmcore

crash: cannot find booted kernel
# -> Specify vmlinux path explicitly

crash: cannot resolve symbol
# -> Check if vmlinux has debug symbols
```

## Security Warnings

⚠️ **Dangerous Operations**

The following commands can cause system damage or data loss:

| Command | Risk | Recommendation |
|---------|------|----------------|
| `wr` | Writes to live kernel memory | **NEVER use on production systems** - can crash or corrupt running kernel |
| GDB passthrough | Unrestricted memory access | Use with caution, may modify memory or registers |

🔒 **Sensitive Data Handling**

- **vmcore files** contain complete kernel memory, potentially including:
  - User process memory and credentials
  - Encryption keys and secrets
  - Network connection data and passwords
- **Access control**: Restrict vmcore file access to authorized personnel
- **Secure storage**: Store dump files in encrypted or access-controlled directories
- **Secure disposal**: Use `shred` or secure delete when disposing of vmcore files

🛡️ **Best Practices**

1. Only analyze vmcore files in isolated/test environments when possible
2. Never share raw vmcore files publicly without sanitization
3. Consider using `makedumpfile -d` to filter sensitive pages before analysis
4. Document and audit all crash analysis sessions for compliance

## Important Notes

1. **Version Match**: vmlinux must exactly match the vmcore kernel version
2. **Debug Info**: Must use vmlinux with debug symbols
3. **Context Awareness**: `bt`, `files`, `vm` commands are affected by current context
4. **Live System Modification**: `wr` command modifies running kernel, extremely dangerous

## Resources

- [Crash Utility Whitepaper](https://crash-utility.github.io/crash_whitepaper.html)
- [Crash Utility Documentation](https://crash-utility.github.io/)
- [Crash Help Pages](https://crash-utility.github.io/help_pages/)

## Contributing

This is an open-source project. Contributions are welcome!

- **GitHub Repository**: https://github.com/crazyss/linux-kernel-crash-debug
- **Report Issues**: [GitHub Issues](https://github.com/crazyss/linux-kernel-crash-debug/issues)
- **Submit PRs**: Pull requests are welcome for bug fixes, new features, or documentation improvements

See [CONTRIBUTING.md](https://github.com/crazyss/linux-kernel-crash-debug/blob/main/CONTRIBUTING.md) for guidelines.