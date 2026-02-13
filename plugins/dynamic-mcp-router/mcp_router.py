#!/usr/bin/env python3
"""
Dynamic MCP Router Server (Optimized with AI Integrations)
===========================================================

This version integrates `uv` for Python execution, `bunx` for Node.js packages,
`orjson` for faster serialization, `httpx` for remote server support (SSE),
`json_repair` for robust JSON handling, and includes new AI services:
`exa`, `serena`, `sequential-thinking`, and `morph-lmm`.

Key Features:
- 🚀 Lazy Loading: Backend MCP servers only start when their tools are needed.
- 📁 Config-driven: Reads configuration from `pyproject.toml` under `[tool.mcp-router]`.
- 🌐 Remote Server Support: Connects to remote MCP servers via SSE using `httpx`.
- ⚡ Performance: Uses `orjson` for faster JSON handling and `json_repair` for robust parsing.
- 🔀 Router Pattern: Single entry point for multiple MCP servers.
- 💾 Token Savings: Only exposes tools that are actually needed.
- 🔌 Plugin Architecture: Easy to add new backend servers.
- ⏱️ Auto-shutdown: Idle servers automatically stop to save resources.
- 🛠️ Ruff Formatting: Strict linting and formatting via Ruff.
- 🐍 `uv` Integration: Uses `uv` for running Python commands.
- 🚀 `bunx` Integration: Uses `bunx` for running Node.js packages.
- 🤖 AI Integrations: Exposes `exa`, `serena`, `sequential-thinking`, `morph-lmm`.

Architecture:
┌─────────────────────────────────────────────────────────────────┐
│                     MCP Router (This Server)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ list_servers│  │ load_server │  │route_to_tool│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌───────────┐         ┌───────────┐         ┌───────────┐
  │ Local Srv │         │ Remote Srv│         │ AI Services│
  │ (lazy)    │         │ (SSE)     │         │ (lazy)    │
  └───────────┘         └───────────┘         └───────────┘
"""
import asyncio
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import hashlib
import json
import logging
import os
import time
import subprocess
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from functools import wraps
import threading
import logging
logger = logging.getLogger(__name__)
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)

# Optimized imports
try:
    import orjson
    logger.info("Using orjson for faster JSON serialization.")
except ImportError:
    logger.warning("orjson not found. Falling back to standard json. Install with: pip install orjson")
    orjson = json

try:
    import httpx
    HTTPX_AVAILABLE = True
    logger.info("httpx available. Enabling remote server support.")
except ImportError:
    HTTPX_AVAILABLE = False
    logger.warning("httpx not found. Remote server support disabled. Install with: pip install httpx")

try:
    import tomli  # For reading pyproject.toml
    TOMLI_AVAILABLE = True
except ImportError:
    TOMLI_AVAILABLE = False
    logger.warning("tomli not found. Cannot read pyproject.toml. Install with: pip install tomli")

try:
    from json_repair import repair_json
    JSON_REPAIR_AVAILABLE = True
    logger.info("json_repair available. Enabling robust JSON parsing.")
except ImportError:
    JSON_REPAIR_AVAILABLE = False
    logger.warning("json_repair not found. Robust JSON parsing disabled. Install with: pip install json-repair")

# Use orjson.dumps if available, otherwise fallback to standard json.dumps
def orjson_dumps_safe(obj: Any, **kwargs) -> str:
    try:
        # Use OPT_INDENT_2 for pretty printing, OPT_NON_STR_KEYS for compatibility
        return orjson.dumps(obj, option=orjson.OPT_INDENT_2 | orjson.OPT_NON_STR_KEYS).decode('utf-8')
    except Exception as e:
        logger.error(f"orjson dump failed: {e}. Falling back to json.dumps.")
        return json.dumps(obj, indent=2)

# Function to safely parse JSON, with fallback to json_repair
def safe_json_loads(data: str | bytes) -> Any:
    if isinstance(data, bytes):
        data = data.decode('utf-8', errors='ignore')
    try:
        return orjson.loads(data)
    except orjson.JSONDecodeError:
        if JSON_REPAIR_AVAILABLE:
            logger.warning("orjson failed to parse. Attempting repair with json_repair.")
            try:
                return json.loads(repair_json(data))
            except Exception as repair_e:
                logger.error(f"json_repair also failed: {repair_e}")
                raise ValueError("Failed to parse JSON even after repair attempt.") from repair_e
        else:
            raise ValueError("Failed to parse JSON and json_repair is not available.")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred during JSON parsing: {e}")


# MCP imports
from mcp.server.fastmcp import FastMCP

try:
    from mcp.client.sse import SseClient, SseServerParameters
    SSE_AVAILABLE = True
except ImportError:
    # Handle API changes or missing module
    try:
        # Try newer API if available?
        # For now, just disable remote support gracefully.
        from mcp.client.sse import sse_client  # type: ignore[import-not-found]
        logger.warning("mcp.client.sse.SseClient not found. Remote server support disabled.")
    except ImportError:
        logger.warning("mcp.client.sse not found. Remote server support disabled.")
    SSE_AVAILABLE = False

    class _SseUnavailable:
        def __init__(self, *args: object, **kwargs: object) -> None:
            raise RuntimeError(
                "MCP SSE client support is not available but a remote server URL was requested. "
                "Install the MCP client SSE dependencies (e.g. `pip install mcp[client] httpx`) "
                "or remove the `url` configuration for this server."
            )

    SseClient = _SseUnavailable  # type: ignore[assignment]
    SseServerParameters = _SseUnavailable  # type: ignore[assignment]
from mcp.client.session import ClientSession

# =============================================================================
# Configuration Models
# =============================================================================

@dataclass
class ServerConfig:
    name: str
    command: str | None = None
    args: list[str] = field(default_factory=list)
    env: dict[str, str] = field(default_factory=dict)
    url: str | None = None  # For remote SSE servers
    description: str = ""
    tags: list[str] = field(default_factory=list)
    auto_load: bool = False
    idle_timeout: int = 300
    enabled: bool = True
    working_dir: str | None = None

    def to_dict(self) -> dict:
        return {
            "command": self.command,
            "args": self.args,
            "env": self.env,
            "url": self.url,
            "description": self.description,
            "tags": self.tags,
            "auto_load": self.auto_load,
            "idle_timeout": self.idle_timeout,
            "enabled": self.enabled,
            "working_dir": self.working_dir
        }

@dataclass
class RouterConfig:
    servers: dict[str, ServerConfig] = field(default_factory=dict)
    config_path: str | None = None
    hot_reload: bool = True
    hot_reload_interval: int = 5
    default_idle_timeout: int = 300
    max_loaded_servers: int = 15


# =============================================================================
# Configuration Manager
# =============================================================================

class ConfigManager:
    def __init__(self, config_path: str | None = None):
        self.config_path = config_path or self._find_config()
        self._config_hash: str | None = None
        self._last_check: float = 0
        self._check_interval = 5
        self._last_mtime: float = 0

    def _find_config(self) -> str | None:
        search_paths = [
            Path.home() / ".config" / "mcp-router" / "pyproject.toml",
            Path("/etc/mcp-router/pyproject.toml"),
            Path.cwd() / "pyproject.toml",
            Path.cwd() / "config" / "pyproject.toml",
        ]
        search_paths = [
            Path.cwd() / "pyproject.toml",
            Path.cwd() / "config" / "pyproject.toml",
            Path.home() / ".config" / "mcp-router" / "pyproject.toml",
            Path("/etc/mcp-router/pyproject.toml")
        ]
        for path in search_paths:
            if path.exists():
                logger.info(f"Found config at: {path}")
                return str(path)
        logger.warning("No pyproject.toml found with [tool.mcp-router] section.")
        return None

    def _compute_hash(self, content: str) -> str:
        return hashlib.md5(content.encode()).hexdigest()

    async def load(self) -> RouterConfig:
        if not self.config_path or not Path(self.config_path).exists():
            logger.warning("No config file found. Using empty configuration.")
            return RouterConfig()

        try:
            def _read_and_parse():
                with open(self.config_path, 'rb') as f:
                    content_bytes = f.read()
                    stat = os.fstat(f.fileno())
                content_str = content_bytes.decode(errors='ignore')
                new_hash = self._compute_hash(content_str)

                if not TOMLI_AVAILABLE:
                    raise RuntimeError("TOML config requires tomli: pip install tomli")
                # Fixed: tomli.loads expects str, not bytes
                data = tomli.loads(content_str)
                return new_hash, data, stat.st_mtime

            self._config_hash, data, mtime = await asyncio.to_thread(_read_and_parse)
            self._last_mtime = mtime

            mcp_router_data = data.get("tool", {}).get("mcp-router", {})
            return self._parse_config(mcp_router_data)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            raise

    def _parse_config(self, data: dict) -> RouterConfig:
        config = RouterConfig(
            config_path=self.config_path,
            hot_reload=data.get("hot_reload", True),
            hot_reload_interval=data.get("hot_reload_interval", 5),
            default_idle_timeout=data.get("default_idle_timeout", 300),
            max_loaded_servers=data.get("max_loaded_servers", 15),
        )
        servers_data = data.get("servers", {})
        for name, server_data in servers_data.items():
            if isinstance(server_data, dict):
                config.servers[name] = ServerConfig(
                    name=name,
                    command=server_data.get("command"),
                    args=server_data.get("args", []),
                    env=server_data.get("env", {}),
                    url=server_data.get("url"),
                    description=server_data.get("description", ""),
                    tags=server_data.get("tags", []),
                    auto_load=server_data.get("auto_load", False),
                    idle_timeout=server_data.get("idle_timeout", config.default_idle_timeout),
                    enabled=server_data.get("enabled", True),
                    working_dir=server_data.get("working_dir"),
                )
        return config

    async def has_changed(self) -> bool:
        if not self.config_path or not Path(self.config_path).exists(): return False
        current_time = time.time()
        if current_time - self._last_check < self._check_interval: return False
        self._last_check = current_time

        try:
            stat = os.stat(self.config_path)
            if stat.st_mtime == self._last_mtime:
                return False
        except OSError:
            return False

        try:
            def _check():
                with open(self.config_path, 'rb') as f:
                    content_bytes = f.read()
                    stat = os.fstat(f.fileno())
                return self._compute_hash(content_bytes.decode(errors='ignore')), stat.st_mtime

            new_hash, new_mtime = await asyncio.to_thread(_check)
            self._last_mtime = new_mtime

            if new_hash != self._config_hash:
                self._config_hash = new_hash
                return True
        except Exception as e: logger.error(f"Error checking config changes: {e}")
        return False


# =============================================================================
# Loaded Server Representation & Manager
# =============================================================================

@dataclass
class LoadedServer:
    config: ServerConfig
    session: ClientSession | None = None
    process: asyncio.subprocess.Process | None = None
    tools: list[dict[str, Any]] = field(default_factory=list)
    resources: list[dict[str, Any]] = field(default_factory=list)
    prompts: list[dict[str, Any]] = field(default_factory=list)
    loaded_at: datetime = field(default_factory=datetime.now)
    last_used: datetime = field(default_factory=datetime.now)
    is_loading: bool = False
    load_error: str | None = None
    _read_stream: Any = None
    _write_stream: Any = None
    is_remote: bool = False


class ServerManager:
    def __init__(self, config: RouterConfig):
        self.config = config
        self.loaded_servers: dict[str, LoadedServer] = {}
        self._lock = asyncio.Lock()
        self._shutdown_event = asyncio.Event()
        self._idle_checker_task: asyncio.Task | None = None

    async def start(self):
        self._idle_checker_task = asyncio.create_task(self._idle_checker())
        for name, server_config in self.config.servers.items():
            if server_config.auto_load and server_config.enabled and (server_config.command or server_config.url):
                logger.info(f"Auto-loading server: {name}")
                await self.load_server(name)

    async def stop(self):
        self._shutdown_event.set()
        if self._idle_checker_task:
            self._idle_checker_task.cancel()
            try: await self._idle_checker_task
            except asyncio.CancelledError: pass
        for name in list(self.loaded_servers.keys()): await self.unload_server(name)

    async def _idle_checker(self):
        while not self._shutdown_event.is_set():
            try:
                await asyncio.sleep(30)
                now = datetime.now()
                servers_to_unload = []
                async with self._lock:
                    for name, server in self.loaded_servers.items():
                        if server.config.idle_timeout > 0:
                            idle_time = (now - server.last_used).total_seconds()
                            if idle_time > server.config.idle_timeout:
                                servers_to_unload.append(name)
                for name in servers_to_unload:
                    logger.info(f"Unloading idle server: {name}")
                    await self.unload_server(name)
            except asyncio.CancelledError: break
            except Exception as e: logger.error(f"Error in idle checker: {e}")

    async def load_server(self, name: str) -> LoadedServer:
        async with self._lock:
            if name in self.loaded_servers: server = self.loaded_servers[name]; server.last_used = datetime.now(); return server
            if name not in self.config.servers: raise ValueError(f"Unknown server: {name}")
            server_config = self.config.servers[name]
            if not server_config.enabled: raise ValueError(f"Server is disabled: {name}")
            if len(self.loaded_servers) >= self.config.max_loaded_servers:
                oldest = min(self.loaded_servers.items(), key=lambda x: x[1].last_used)
                logger.info(f"Max servers reached, unloading: {oldest[0]}")
                await self._unload_server_internal(oldest[0])
            loaded = LoadedServer(config=server_config, is_loading=True)
            self.loaded_servers[name] = loaded
        try:
            await self._connect_to_server(loaded)
            loaded.is_loading = False
            logger.info(f"✅ Loaded server: {name} with {len(loaded.tools)} tools")
            return loaded
        except Exception as e:
            loaded.is_loading = False; loaded.load_error = str(e); logger.error(f"❌ Failed to load server {name}: {e}"); raise

    async def _connect_to_server(self, loaded: LoadedServer):
        config = loaded.config
        env = os.environ.copy(); env.update(config.env)

        if config.url: # Remote SSE server
            if not HTTPX_AVAILABLE: raise RuntimeError("httpx is required for remote servers. Install with: pip install httpx")
            loaded.is_remote = True
            session = ClientSession(transport=httpx.AsyncHTTPTransport(retries=3, timeout=httpx.Timeout(30.0)))
            await session.__aenter__()
            loaded.session = session
            sse_params = SseServerParameters(url=config.url, headers={"User-Agent": "MCPRouter/1.0"}, env=env)
            read_stream, write_stream = await SseClient(sse_params).__aenter__()
            loaded._read_stream = read_stream; loaded._write_stream = write_stream

        elif config.command: # Local subprocess server
            cmd_parts = []
            if config.command == "python": cmd_parts.extend(["uv", "run"])
            elif config.command == "bunx": cmd_parts.extend(["bunx", "--bun"])
            else: cmd_parts.append(config.command)
            cmd_parts.extend(config.args)

            process = await asyncio.create_subprocess_exec(
                *cmd_parts, env=env, cwd=config.working_dir,
                stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            loaded.process = process
            read_stream, write_stream = process.stdout, process.stdin
            if not read_stream or not write_stream: raise RuntimeError("Failed to create pipes for subprocess.")
            session = ClientSession(read_stream, write_stream)
            await session.__aenter__(); loaded.session = session
        else:
            raise ValueError(f"Server '{config.name}' must have either 'command' or 'url' defined.")

        await session.initialize()
        try:
            tools_result = await session.list_tools()
            loaded.tools = [{"name": tool.name, "description": tool.description or "", "inputSchema": tool.inputSchema if hasattr(tool, 'inputSchema') else {}} for tool in tools_result.tools]
        except Exception as e: logger.warning(f"Could not list tools for {config.name}: {e}")
        try:
            resources_result = await session.list_resources()
            loaded.resources = [{"uri": res.uri, "name": res.name or "", "description": res.description or ""} for res in resources_result.resources]
        except Exception as e: logger.debug(f"Could not list resources for {config.name}: {e}")
        try:
            prompts_result = await session.list_prompts()
            loaded.prompts = [{"name": prompt.name, "description": prompt.description or ""} for prompt in prompts_result.prompts]
        except Exception as e: logger.debug(f"Could not list prompts for {config.name}: {e}")

    async def unload_server(self, name: str) -> bool:
        async with self._lock:
            return await self._unload_server_internal(name)

    async def _unload_server_internal(self, name: str) -> bool:
        if name not in self.loaded_servers: return False
        loaded = self.loaded_servers[name]
        try:
            if loaded.session: await loaded.session.__aexit__(None, None, None)
            if loaded.process and loaded.process.returncode is None:
                loaded.process.terminate()
                try:
                    await asyncio.wait_for(loaded.process.wait(), timeout=5.0)
                except asyncio.TimeoutError: loaded.process.kill()
                logger.info(f"Terminated subprocess for server: {name}")
        except Exception as e: logger.error(f"Error unloading server {name}: {e}")
        del self.loaded_servers[name]
        logger.info(f"🔌 Unloaded server: {name}")
        return True

    async def call_tool(self, server_name: str, tool_name: str, arguments: dict) -> Any:
        if server_name not in self.loaded_servers: await self.load_server(server_name)
        loaded = self.loaded_servers[server_name]; loaded.last_used = datetime.now()
        if not loaded.session: raise RuntimeError(f"Server {server_name} not properly connected")
        result = await loaded.session.call_tool(tool_name, arguments)
        return safe_json_loads(result)

    async def read_resource(self, server_name: str, uri: str) -> Any:
        if server_name not in self.loaded_servers: await self.load_server(server_name)
        loaded = self.loaded_servers[server_name]; loaded.last_used = datetime.now()
        if not loaded.session: raise RuntimeError(f"Server {server_name} not properly connected")
        result = await loaded.session.read_resource(uri)
        return safe_json_loads(result)

    def update_config(self, new_config: RouterConfig):
        self.config = new_config; logger.info("Configuration updated")

    def get_all_tools(self) -> dict[str, list[dict]]:
        return {name: server.tools for name, server in self.loaded_servers.items()}

    def get_server_status(self) -> dict[str, dict]:
        status = {}
        for name, config in self.config.servers.items():
            loaded = self.loaded_servers.get(name)
            status[name] = {
                "configured": True, "enabled": config.enabled,
                "loaded": loaded is not None, "loading": loaded.is_loading if loaded else False,
                "error": loaded.load_error if loaded else None,
                "tools_count": len(loaded.tools) if loaded else 0,
                "last_used": loaded.last_used.isoformat() if loaded else None,
                "is_remote": loaded.is_remote if loaded else False,
                "description": config.description, "tags": config.tags,
            }
        return status


# =============================================================================
# Main Router MCP Server
# =============================================================================

config_manager: ConfigManager | None = None
server_manager: ServerManager | None = None
mcp = FastMCP("MCPRouter")

# Decorator to ensure server_manager is initialized
def require_server_manager(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        if not server_manager:
            return {"error": "Server manager not initialized"}
        return await func(*args, **kwargs)
    return wrapper

# --- Router Tools ---

@mcp.tool()
@require_server_manager
async def list_available_servers() -> dict:
    status = server_manager.get_server_status()
    return {"servers": status, "loaded_count": len(server_manager.loaded_servers), "max_loaded": server_manager.config.max_loaded_servers, "config_path": config_manager.config_path if config_manager else None}

@mcp.tool()
@require_server_manager
async def load_server(server_name: str) -> dict:
    try:
        loaded = await server_manager.load_server(server_name)
        return {"success": True, "server": server_name, "tools": loaded.tools, "resources": loaded.resources, "prompts": loaded.prompts, "is_remote": loaded.is_remote, "message": f"Server '{server_name}' loaded with {len(loaded.tools)} tools"}
    except Exception as e: return {"success": False, "server": server_name, "error": str(e)}

@mcp.tool()
@require_server_manager
async def unload_server(server_name: str) -> dict:
    success = await server_manager.unload_server(server_name)
    return {"success": success, "server": server_name, "message": f"Server '{server_name}' {'unloaded' if success else 'was not loaded'}"}

@mcp.tool()
@require_server_manager
async def list_server_tools(server_name: str) -> dict:
    try:
        loaded = await server_manager.load_server(server_name)
        return {"server": server_name, "tools": loaded.tools, "count": len(loaded.tools)}
    except Exception as e: return {"server": server_name, "error": str(e)}

@mcp.tool()
@require_server_manager
async def call_server_tool(server_name: str, tool_name: str, arguments: dict | None = None) -> dict:
    try:
        result = await server_manager.call_tool(server_name, tool_name, arguments or {})
        return {"success": True, "server": server_name, "tool": tool_name, "result": result}
    except Exception as e: return {"success": False, "server": server_name, "tool": tool_name, "error": str(e)}

@mcp.tool()
@require_server_manager
async def search_tools(query: str, tags: list[str] | None = None) -> dict:
    results = []
    query_lower = query.lower()
    for name, loaded in server_manager.loaded_servers.items():
        config = loaded.config
        if tags and not any(t in config.tags for t in tags): continue
        for tool in loaded.tools:
            tool_name = tool.get("name", "")
            tool_desc = tool.get("description", "")
            if query_lower in tool_name.lower() or query_lower in tool_desc.lower():
                results.append({"server": name, "tool": tool_name, "description": tool_desc, "loaded": True, "is_remote": loaded.is_remote})
    for name, config in server_manager.config.servers.items():
        if name in server_manager.loaded_servers: continue
        if tags and not any(t in config.tags for t in tags): continue
        if query_lower in config.description.lower() or query_lower in name.lower():
            results.append({"server": name, "tool": None, "description": config.description, "loaded": False, "hint": "Load this server to discover its tools"})
    return {"query": query, "results": results, "count": len(results)}

@mcp.tool()
@require_server_manager
async def get_router_status() -> dict:
    status = server_manager.get_server_status()
    return {"router": "MCPRouter", "version": "2.1.0", "config_path": config_manager.config_path if config_manager else None, "hot_reload_enabled": server_manager.config.hot_reload, "loaded_servers": list(server_manager.loaded_servers.keys()), "loaded_count": len(server_manager.loaded_servers), "configured_count": len(server_manager.config.servers), "max_loaded": server_manager.config.max_loaded_servers, "servers": status}

@mcp.tool()
async def reload_config() -> dict:
    global config_manager, server_manager
    if not config_manager: return {"error": "Config manager not initialized"}
    try:
        new_config = await config_manager.load()
        server_manager.update_config(new_config)
        return {"success": True, "message": "Configuration reloaded", "servers_count": len(new_config.servers), "servers": list(new_config.servers.keys())}
    except Exception as e: return {"success": False, "error": str(e)}

# --- Resources ---

@mcp.resource("router://config")
async def get_config_resource() -> str:
    if not server_manager: return json_dumps({"error": "Not initialized"}).decode('utf-8')
    config_dict = {
        "hot_reload": server_manager.config.hot_reload,
        "max_loaded_servers": server_manager.config.max_loaded_servers,
        "default_idle_timeout": server_manager.config.default_idle_timeout,
        "servers": {name: cfg.to_dict() for name, cfg in server_manager.config.servers.items()}
    }
    return json_dumps(config_dict).decode('utf-8')

@mcp.resource("router://status")
async def get_status_resource() -> str:
    if not server_manager: return json_dumps({"error": "Not initialized"}).decode('utf-8')
    return json_dumps(server_manager.get_server_status()).decode('utf-8')

# =============================================================================
# Main Entry Point & Server Runner
# =============================================================================

async def run_router(config_path: str | None = None, transport: str = "stdio",
                     host: str = "127.0.0.1", port: int = 8000):
    global config_manager, server_manager
    config_manager = ConfigManager(config_path)
    config = await config_manager.load()
    server_manager = ServerManager(config)
    await server_manager.start()
    logger.info(f"🚀 MCP Router started with {len(config.servers)} configured servers")

    async def hot_reload_checker():
        while True:
            await asyncio.sleep(config.hot_reload_interval)
            if config.hot_reload and await config_manager.has_changed():
                logger.info("🔄 Configuration changed, reloading...")
                try:
                    new_config = await config_manager.load()
                    server_manager.update_config(new_config)
                except Exception as e: logger.error(f"Failed to reload config: {e}")

    if config.hot_reload: asyncio.create_task(hot_reload_checker())

    try:
        if transport == "http":
            mcp.run(transport="http", host=host, port=port)
        elif transport == "sse":
            if not hasattr(mcp, 'run_sse'): raise NotImplementedError("SSE transport is not implemented in this FastMCP version.")
            mcp.run_sse(host=host, port=port)
        else: mcp.run(transport="stdio")
    finally:
        await server_manager.stop()

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Optimized MCP Router Server")
    parser.add_argument("-c", "--config", help="Path to pyproject.toml config file")
    parser.add_argument("--transport", choices=["stdio", "http", "sse"], default="stdio", help="Transport type (default: stdio)")
    parser.add_argument("--host", default="0.0.0.0", help="Host for HTTP/SSE transport")
    parser.add_argument("--port", type=int, default=8000, help="Port for HTTP/SSE transport")
    parser.add_argument("--create-example-config", action="store_true", help="Create an example pyproject.toml")

    args = parser.parse_args()
    if args.create_example_config:
        create_example_config()
        return
    asyncio.run(run_router(config_path=args.config, transport=args.transport, host=args.host, port=args.port))

# --- Example Config Generation ---
def create_example_config():
    example_config = {
        "hot_reload": True, "hot_reload_interval": 5, "default_idle_timeout": 300, "max_loaded_servers": 15,
        "servers": {
            "exa": {"command": "bunx --bun", "args": ["@modelcontextprotocol/server-exa"], "description": "Web search and company research using Exa", "tags": ["search", "web", "research", "exa"], "auto_load": True, "idle_timeout": 300},
            "serena": {"command": "bunx --bun", "args": ["@modelcontextprotocol/server-serena"], "description": "Serena AI for conversational tasks", "tags": ["ai", "conversational", "serena"]},
            "sequential_thinking": {"command": "bunx --bun", "args": ["@modelcontextprotocol/server-sequential-thinking"], "description": "Sequential Thinking tool for problem-solving", "tags": ["ai", "planning", "sequential", "thinking"]},
            "morph_lmm": {"command": "bunx --bun", "args": ["@modelcontextprotocol/server-morph-lmm"], "description": "Morph-LMM AI for faster concept application", "tags": ["ai", "morph-lmm", "concepts"]},
            "github": {"command": "bunx --bun", "args": ["@modelcontextprotocol/server-github"], "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}, "description": "GitHub API integration", "tags": ["git", "code"], "idle_timeout": 600},
            "filesystem": {"command": "bunx --bun", "args": ["@modelcontextprotocol/server-filesystem", "/tmp"], "description": "Local file system access", "tags": ["files", "local"], "idle_timeout": 300},
            "memory": {"command": "bunx --bun", "args": ["@modelcontextprotocol/server-memory"], "description": "Persistent memory/knowledge graph", "tags": ["memory", "knowledge"], "idle_timeout": 0},
             "remote-math-sse": {"url": "http://localhost:8090/sse", "description": "Remote math server via SSE using httpx", "tags": ["remote", "math", "sse"], "idle_timeout": 120},
            "custom-python": {"command": "python", "args": ["-m", "my_custom_mcp_server"], "working_dir": "/workspace/mcp_router", "description": "Example custom Python MCP server", "tags": ["custom", "python"], "enabled": False}
        }
    }

    filename = "pyproject.toml"
    try:
        with open(filename, 'w') as f:
            f.write(textwrap.dedent("""\
                [project]
                name = "dynamic-mcp-router"
                version = "2.1.0"
                description = "High-performance, lazy-loading MCP Router with advanced AI integrations"
                requires-python = ">=3.11"
                dependencies = [
                    "fastmcp>=1.0.0",
                    "orjson>=3.9.10",
                    "httpx>=0.27.0",
                    "tomli>=2.0.1; python_version < '3.11'",
                    "json-repair>=0.1.0", # Added json-repair
                ]

                [tool.ruff]
                line-length = 100
                target-version = "py311"
                [tool.ruff.lint]
                select = ["E", "W", "F", "I", "B", "UP", "SIM"]
                ignore = ["E501"]
                [tool.ruff.format]
                quote-style = "double"
                indent-style = "space"

                [tool.mcp-router]
                hot_reload = true
                hot_reload_interval = 5
                default_idle_timeout = 300
                max_loaded_servers = 15

                # --- Server Definitions ---
                """))
            for name, cfg in example_config['servers'].items():
                f.write(f"\n[tool.mcp-router.servers.{name}]\n")
                if cfg.get('command'):
                    cmd = cfg['command']
                    if cmd == "python":
                        f.write("command = \"uv run python\"\n")
                    elif cmd == "bunx --bun":
                        f.write("command = \"bunx --bun\"\n")
                    else:
                        f.write(f"command = \"{cmd}\"\n")
                if cfg.get('args'): f.write(f"args = {json.dumps(cfg['args'])}\n")
                if cfg.get('env'):
                    f.write("env = {\n")
                    for key, val in cfg['env'].items(): f.write(f"    {key} = \"{val}\"\n")
                    f.write("    }\n")
                if cfg.get('url'): f.write(f"url = \"{cfg['url']}\"\n")
                if cfg.get('description'): f.write(f"description = \"{cfg['description']}\"\n")
                if cfg.get('tags'): f.write(f"tags = {json.dumps(cfg['tags'])}\n")
                if cfg.get('auto_load') is not None: f.write(f"auto_load = {str(cfg['auto_load']).lower()}\n")
                if cfg.get('idle_timeout') is not None: f.write(f"idle_timeout = {cfg['idle_timeout']}\n")
                if cfg.get('enabled') is not None: f.write(f"enabled = {str(cfg['enabled']).lower()}\n")
                if cfg.get('working_dir'): f.write(f"working_dir = \"{cfg['working_dir']}\"\n")
    except Exception as e: logger.error(f"Failed to create example config file: {e}"); return
    print(f"\n✅ Created example configuration: {filename}")
    print("\nEdit this file to configure your MCP servers.")
    print("Then run: python mcp_router.py")

if __name__ == "__main__":
    main()
