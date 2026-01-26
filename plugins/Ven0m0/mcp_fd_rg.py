#!/usr/bin/env python3
import json, sys, subprocess

def reply(id_, result=None, error=None):
    out = {"jsonrpc": "2.0", "id": id_}
    if error:
        out["error"] = {"code": -1, "message": error}
    else:
        out["result"] = result
    sys.stdout.write(json.dumps(out) + "\n")
    sys.stdout.flush()

def run(cmd, input_text=None):
    try:
        return subprocess.check_output(
            cmd,
            input=input_text,
            stderr=subprocess.DEVNULL,
            text=True
        )
    except subprocess.CalledProcessError:
        return ""

for line in sys.stdin:
    req = json.loads(line)
    mid = req.get("id")
    method = req.get("method")
    params = req.get("params", {})

    if method == "initialize":
        reply(mid, {
            "capabilities": {
                "tools": [
                    {
                        "name": "fd_files",
                        "description": "File discovery using fd",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "pattern": {"type": "string"},
                                "path": {"type": "string", "default": "."}
                            },
                            "required": ["pattern"]
                        }
                    },
                    {
                        "name": "rg_search",
                        "description": "Text search using ripgrep",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "pattern": {"type": "string"},
                                "path": {"type": "string", "default": "."}
                            },
                            "required": ["pattern"]
                        }
                    },
                    {
                        "name": "jaq_query",
                        "description": "JSON query using jaq (jq-compatible)",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "filter": {"type": "string"},
                                "json": {"type": "string"}
                            },
                            "required": ["filter", "json"]
                        }
                    },
                    {
                        "name": "yq_query",
                        "description": "YAML query using yq",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "filter": {"type": "string"},
                                "yaml": {"type": "string"}
                            },
                            "required": ["filter", "yaml"]
                        }
                    }
                ]
            }
        })

    elif method == "tools/call":
        name = params.get("name")
        args = params.get("arguments", {})

        if name == "fd_files":
            out = run([
                "fd", "--hidden", "--follow", "--exclude", ".git",
                args.get("pattern"), args.get("path", ".")
            ])
            reply(mid, {"content": [{"type": "text", "text": out}]})

        elif name == "rg_search":
            out = run([
                "rg", "--hidden", "--follow", "--glob", "!.git",
                args.get("pattern"), args.get("path", ".")
            ])
            reply(mid, {"content": [{"type": "text", "text": out}]})

        elif name == "jaq_query":
            out = run(
                ["jaq", args.get("filter")],
                input_text=args.get("json")
            )
            reply(mid, {"content": [{"type": "text", "text": out}]})

        elif name == "yq_query":
            out = run(
                ["yq", args.get("filter")],
                input_text=args.get("yaml")
            )
            reply(mid, {"content": [{"type": "text", "text": out}]})

        else:
            reply(mid, error="unknown tool")

    else:
        reply(mid, error="unknown method")
