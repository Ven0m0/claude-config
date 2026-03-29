# RTK Compressor Skill

智能压缩 CLI 命令输出，降低 token 消耗 60-90%。

## 功能

- 移除注释、空行、样板代码
- 聚合相似项
- 保留核心信息
- 支持多种输出类型：ls/tree、cat/read、测试输出、JSON/日志

## 使用方式

```bash
# 直接压缩输出
echo "输出内容" | rtk-compressor

# 或在代码中调用
python3 -m rtk_compressor compress "原始输出"
```

## 压缩效果

| 命令类型 | 原始 tokens | 压缩后 | 节省 |
|----------|------------|--------|------|
| ls/tree | 2000 | 400 | 80% |
| cat/read | 40000 | 12000 | 70% |
| 测试输出 | 25000 | 2500 | 90% |

## 安装

```bash
pip install rtk-compressor
```
