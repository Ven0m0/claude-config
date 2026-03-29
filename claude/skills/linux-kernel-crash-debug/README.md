# Linux Kernel Crash Debug Skill

[中文文档](README_CN.md)

Welcome to **Linux Kernel Crash Debug Skill**! This is a Claude Code skill that helps you debug Linux kernel crashes using the crash utility.

## Features

- **Quick Start Guide**: Essential commands and debugging workflow
- **Complete Command Reference**: All crash utility commands with examples
- **Advanced Techniques**: Memory analysis, linked list traversal, address translation
- **Real-world Cases**: Kernel BUG, deadlock, OOM, NULL pointer, stack overflow
- **vmcore Knowledge**: ELF format, VMCOREINFO, dump file types

## Installation

```bash
# Download the skill file
git clone https://github.com/crazyss/linux-kernel-crash-debug.git

# Install in Claude Code
claude skill install linux-kernel-crash-debug.skill
```

## Quick Start

```bash
# Start crash session
crash vmlinux vmcore

# Basic debugging flow
crash> sys              # Check panic reason
crash> log              # View kernel log
crash> bt               # Backtrace
crash> struct <type>    # Inspect data structures
crash> kmem <addr>      # Memory analysis
```

## Structure

```
linux-kernel-crash-debug/
├── SKILL.md                    # Main skill file (English)
├── SKILL_CN.md                 # Chinese version of skill
├── README.md                   # English documentation
├── README_CN.md                # Chinese documentation
├── CONTRIBUTING.md             # Contribution guide
├── LICENSE                     # MIT License
├── linux-kernel-crash-debug.skill  # Packaged skill
└── references/                 # Detailed documentation
    ├── advanced-commands.md    # In-depth command usage
    ├── vmcore-format.md        # vmcore file format details
    └── case-studies.md         # Real-world debugging examples
```

## Usage

This skill triggers when you mention:
- kernel crash / kernel panic
- vmcore analysis
- crash utility
- kernel oops debugging

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

- Report bugs or request features via [Issues](https://github.com/crazyss/linux-kernel-crash-debug/issues)
- Submit improvements via Pull Requests

## Resources

- [Crash Utility Whitepaper](https://crash-utility.github.io/crash_whitepaper.html)
- [Crash Utility Documentation](https://crash-utility.github.io/)
- [Crash Help Pages](https://crash-utility.github.io/help_pages/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with passion for kernel debugging