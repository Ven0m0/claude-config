#!/usr/bin/env python3
"""
Example Custom Python MCP Server
================================

This is a simple example of a custom Python MCP server that can be
run by the MCP Router.

It exposes tools for greeting, adding, and providing server info.
It also supports SSE transport.
"""

from fastmcp import FastMCP
from typing import Dict, Callable, Any
from dataclasses import dataclass
import orjson
import asyncio

# Initialize the custom MCP server
mcp = FastMCP("CustomPythonServer")

@mcp.tool
def greet(name: str, greeting: str = "Hello") -> str:
    """Greets a person with a custom greeting."""
    return f"{greeting}, {name}! Welcome to the custom server."

@mcp.tool
def add(a: int, b: int) -> int:
    """Adds two integers."""
    return a + b

# Resource example
@mcp.resource("server://info")
def server_info_resource() -> str:
    """Provides basic info about this custom server."""
    info = {"server_name": "CustomPythonServer", "version": "1.0.0", "tools": ["greet", "add"]}
    return orjson.dumps(info).decode('utf-8')

# SSE transport requires an async run function
async def run_sse_server():
    """Runs the FastMCP server using SSE transport."""
    await mcp.run_sse(host="0.0.0.0", port=8001)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Custom Python MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "http", "sse"],
        default="stdio",
        help="Transport type (default: stdio)"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host for HTTP/SSE transport"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8001, # Use a different port for custom servers
        help="Port for HTTP/SSE transport"
    )
    
    args = parser.parse_args()
    
    print(f"🚀 Starting Custom Python MCP Server")
    print(f"   Transport: {args.transport}")
    
    if args.transport == "http":
        mcp.run(transport="http", host=args.host, port=args.port)
    elif args.transport == "sse":
        asyncio.run(run_sse_server())
    else:
        mcp.run(transport="stdio")
