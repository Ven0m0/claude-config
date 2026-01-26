#!/usr/bin/env python3
"""
MCP server exposing only `jaq` for structured data querying over JSON/YAML/TOML/XML/CBOR.

Tools:
 - jaq_query: single filter against file or inline content
 Supports streaming and chunking.
"""

import json, sys, subprocess, shutil

DEFAULT_CHUNK = 16 * 1024

def send(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()

def reply(id_, result=None, error=None, more=False):
    out = {"jsonrpc": "2.0", "id": id_}
    if error:
        out["error"] = {"code": -1, "message": error}
    else:
        if result is None:
            result = {}
        result["_more"] = more
        out["result"] = result
    send(out)

def stream_subprocess(id_, proc, chunk_size):
    try:
        while True:
            chunk = proc.stdout.read(chunk_size)
            if chunk:
                reply(id_, {"content": [{"type": "text", "text": chunk}]}, more=True)
            else:
                break
        proc.wait()
        return True
    except Exception as e:
        try: proc.kill()
        except Exception: pass
        reply(id_, error=f"stream error: {e}")
        return False

def run_streaming_cmd(id_, cmd, chunk_size):
    proc = subprocess.Popen(cmd,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL,
                            text=True)
    stream_subprocess(id_, proc, chunk_size)
    reply(id_, {"content": [{"type": "text", "text": ""}]}, more=False)

def run_capture(cmd, input_text=None):
    try:
        return subprocess.check_output(
            cmd, input=input_text,
            stderr=subprocess.DEVNULL, text=True
        )
    except subprocess.CalledProcessError:
        return ""

def check_bins():
    if not shutil.which("jaq"):
        sys.stderr.write("error: `jaq` not found\n")
        sys.stderr.flush()

check_bins()

for raw in sys.stdin:
    if not raw.strip():
        continue
    try:
        req = json.loads(raw)
    except Exception:
        continue

    mid = req.get("id")
    method = req.get("method")
    params = req.get("params") or {}

    if method == "initialize":
        caps = {
            "capabilities": {
                "tools": [
                    {
                        "name": "jaq_query",
                        "description": "Structured data query using jaq (JSON/YAML/TOML/XML/CBOR)",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "filter": {"type": "string"},
                                "file": {"type": "string"},
                                "input_format": {"type": "string"},
                                "output_format": {"type": "string"},
                                "stream": {"type": "boolean"},
                                "chunk_size": {"type": "integer"},
                                "inline": {"type": "string"}
                            },
                            "required": ["filter"]
                        }
                    }
                ]
            }
        }
        reply(mid, caps)
        continue

    if method == "tools/call":
        name = params.get("name")
        args = params.get("arguments") or {}

        if name != "jaq_query":
            reply(mid, error="unknown tool")
            continue

        filt = args.get("filter", "")
        path = args.get("file")
        infmt = args.get("input_format")
        outf = args.get("output_format", "json")
        stream = bool(args.get("stream", False))
        chunk_size = int(args.get("chunk_size", DEFAULT_CHUNK))
        inline = args.get("inline")

        base = ["jaq", "--monochrome-output", "-c"]
        if infmt:
            base += ["--from", infmt]
        if outf:
            base += ["--to", outf]

        if path:
            cmd = base + [filt, path]
            if stream:
                run_streaming_cmd(mid, cmd, chunk_size)
            else:
                out = run_capture(cmd)
                reply(mid, {"content": [{"type": "text", "text": out}]}, more=False)
        else:
            cmd = base + [filt]
            if stream:
                proc = subprocess.Popen(cmd,
                                        stdin=subprocess.PIPE,
                                        stdout=subprocess.PIPE,
                                        stderr=subprocess.DEVNULL,
                                        text=True)
                if inline:
                    try:
                        proc.stdin.write(inline)
                        proc.stdin.close()
                    except Exception:
                        pass
                stream_subprocess(mid, proc, chunk_size)
                reply(mid, {"content": [{"type": "text", "text": ""}]}, more=False)
            else:
                out = run_capture(cmd, input_text=inline)
                reply(mid, {"content": [{"type": "text", "text": out}]}, more=False)

    else:
        reply(mid, error="unknown method")
