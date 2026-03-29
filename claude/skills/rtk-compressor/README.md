# RTK Compressor

[![PyPI Version](https://img.shields.io/pypi/v/rtk-compressor.svg)](https://pypi.org/project/rtk-compressor/)
[![Python Version](https://img.shields.io/pypi/pyversions/rtk-compressor.svg)](https://pypi.org/project/rtk-compressor/)

智能压缩 CLI 命令输出，降低 token 消耗 60-90%。

## 功能

- 移除注释、空行、样板代码
- 聚合相似项
- 保留核心信息
- 支持多种输出类型：ls/tree、cat/read、测试输出、JSON/日志

## 安装

```bash
pip install rtk-compressor
```

## 使用方式

```bash
# 直接压缩输出
echo "输出内容" | rtk-compress

# 压缩文件
cat large_file.txt | rtk-compress

# 作为 Python 模块使用
python3 -c "from rtk_compressor import RTKCompressor; c = RTKCompressor(); print(c.compress('原始输出'))"
```

## 压缩效果

| 命令类型 | 原始 tokens | 压缩后 | 节省 |
|----------|------------|--------|------|
| ls/tree | 2000 | 400 | 80% |
| cat/read | 40000 | 12000 | 70% |
| 测试输出 | 25000 | 2500 | 90% |

## 支持的压缩模式

- `auto` - 自动检测类型
- `code` - 代码文件
- `list` - 目录/列表
- `json` - JSON 数据
- `log` - 日志文件
- `generic` - 通用文本

## OpenClaw Skill

这个项目也可以作为 OpenClaw Skill 使用：

```bash
# 在 OpenClaw 中使用
openclaw skills install rtk-compressor
```

## License

MIT
