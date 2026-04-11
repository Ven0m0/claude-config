#!/usr/bin/env python3
"""
mcp_inspector.py - MCP server inspector for mcp-to-skill

连接 MCP server，提取 tool schemas，尝试拉取源码。
输出 inspector.json 供 AI 层分析。

用法：
  python mcp_inspector.py "npx -y @modelcontextprotocol/server-github" --output inspector.json
  python mcp_inspector.py --schema-json tools.json --server-name github
"""

import argparse
import asyncio
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


def detect_package(command: str) -> Optional[str]:
    """从命令字符串推断 npm 包名。返回包名或 None。"""
    parts = command.split()
    for i, part in enumerate(parts):
        # npx [-y/--yes] <package>
        if part in ("-y", "--yes") and i + 1 < len(parts):
            candidate = parts[i + 1]
            # 排除本地路径（以 . 或 / 开头）
            if not candidate.startswith(".") and not candidate.startswith("/"):
                return candidate
    return None


def fetch_source(
    package: Optional[str], local_path: Optional[str] = None
) -> Optional[str]:
    """
    拉取 MCP server 源码。失败返回 None，不抛出异常。
    优先级：local_path > npm pack > 返回 None
    """
    # 本地路径优先
    if local_path and Path(local_path).exists():
        return local_path

    if not package:
        return None

    # 构建缓存目录
    safe_name = package.replace("/", "-").lstrip("@-")
    cache_dir = Path(tempfile.gettempdir()) / "mcp-to-skill-cache" / safe_name

    # 已缓存则直接返回（排除仅含 .tgz 的失败解压目录）
    if cache_dir.exists() and any(f for f in cache_dir.iterdir() if f.suffix != ".tgz"):
        return str(cache_dir)

    cache_dir.mkdir(parents=True, exist_ok=True)

    try:
        # npm pack 下载 tarball
        result = subprocess.run(
            ["npm", "pack", package],
            capture_output=True,
            text=True,
            cwd=str(cache_dir),
            timeout=60,
        )
        if result.returncode != 0:
            return None

        tarball = next(cache_dir.glob("*.tgz"), None)
        if not tarball:
            return None

        # 解压（--strip-components=1 去掉 package/ 前缀）
        extract_result = subprocess.run(
            ["tar", "xzf", str(tarball), "--strip-components=1"],
            capture_output=True,
            cwd=str(cache_dir),
            timeout=30,
        )
        if extract_result.returncode != 0:
            return None

        return str(cache_dir)
    except Exception:
        return None


async def connect_and_list_tools(command: str) -> list[dict]:
    """
    通过 MCP JSON-RPC 协议连接 server，返回 tool 列表。
    command: 完整命令字符串，如 "npx -y @mcp/server-github"
    """
    parts = command.split()
    cmd = parts[0]
    cmd_args = parts[1:]

    params = StdioServerParameters(command=cmd, args=cmd_args)
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.list_tools()
            return [
                {
                    "name": tool.name,
                    "description": tool.description or "",
                    "inputSchema": tool.inputSchema or {},
                }
                for tool in result.tools
            ]


def main():
    parser = argparse.ArgumentParser(
        description="MCP Inspector — 提取 MCP server tool schemas 和源码",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 连接已安装的 MCP server
  python mcp_inspector.py "npx -y @modelcontextprotocol/server-github" --output inspector.json

  # 使用已有 schema JSON（跳过 MCP 连接）
  python mcp_inspector.py --schema-json tools.json --server-name github
        """,
    )
    parser.add_argument("command", nargs="?", help="MCP server 启动命令")
    parser.add_argument(
        "--schema-json", help="已有 tool schema JSON 文件路径（跳过 MCP 连接）"
    )
    parser.add_argument("--server-name", help="覆盖 server 名称")
    parser.add_argument(
        "--output",
        default="inspector.json",
        help="输出文件路径（默认：inspector.json）",
    )
    args = parser.parse_args()

    # 模式 1：直接使用 schema JSON
    if args.schema_json:
        with open(args.schema_json) as f:
            tools = json.load(f)
        result = {
            "server_name": args.server_name or "unknown",
            "package": None,
            "source_path": None,
            "tools": tools,
        }
        _write_output(result, args.output)
        return

    if not args.command:
        parser.error("需要提供 'command' 或 '--schema-json'")

    # 模式 2：连接 MCP server
    tools = asyncio.run(connect_and_list_tools(args.command))
    package = detect_package(args.command)
    source_path = fetch_source(package)

    # 推断 server_name：包名末段 或 命令末段
    if args.server_name:
        server_name = args.server_name
    elif package:
        server_name = package.split("/")[-1]
    else:
        server_name = args.command.split()[-1].split("/")[-1]

    result = {
        "server_name": server_name,
        "package": package,
        "source_path": source_path,
        "tools": tools,
    }
    _write_output(result, args.output)


def _write_output(result: dict, output_path: str):
    """写入 inspector.json 并打印摘要。"""
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    tool_count = len(result["tools"])
    src = result["source_path"] or "（无源码）"
    print(f"✓ 写入 {output_path}：{tool_count} 个 tool，源码：{src}")


if __name__ == "__main__":
    main()
