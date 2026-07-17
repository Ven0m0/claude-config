#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API_BASE = "https://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering/markdown"


def fail(msg: str, code: int = 1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def load_json_arg(raw, flag_name):
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        fail(f"Invalid JSON for {flag_name}: {e}")


def build_body(args):
    body = {}
    if args.url:
        body["url"] = args.url
    elif args.html is not None:
        body["html"] = args.html
    else:
        fail("Either --url or --html is required")

    goto_options = load_json_arg(args.goto_options_json, "--goto-options-json") or {}
    if args.wait_until:
        goto_options["waitUntil"] = args.wait_until
    if args.timeout_ms is not None:
        goto_options["timeout"] = args.timeout_ms
    if goto_options:
        body["gotoOptions"] = goto_options

    if args.user_agent:
        body["userAgent"] = args.user_agent

    cookies = load_json_arg(args.cookies_json, "--cookies-json")
    if cookies is not None:
        body["cookies"] = cookies

    auth = load_json_arg(args.authenticate_json, "--authenticate-json")
    if auth is not None:
        body["authenticate"] = auth

    patterns = load_json_arg(
        args.reject_request_pattern_json, "--reject-request-pattern-json",
    )
    if patterns is not None:
        body["rejectRequestPattern"] = patterns

    return body


def request_markdown(account_id, token, cache_ttl, body):
    params = {}
    if cache_ttl is not None:
        params["cacheTTL"] = str(cache_ttl)
    url = API_BASE.format(account_id=account_id)
    if params:
        url += "?" + urllib.parse.urlencode(params)

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        fail(f"HTTP {e.code}: {detail}")
    except urllib.error.URLError as e:
        fail(f"Request failed: {e}")


def main():
    p = argparse.ArgumentParser(
        description="Call Cloudflare Browser Rendering /markdown",
    )
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--url")
    src.add_argument("--html")
    p.add_argument(
        "--wait-until",
        choices=["load", "domcontentloaded", "networkidle0", "networkidle2"],
    )
    p.add_argument(
        "--timeout-ms", type=int, help="Set gotoOptions.timeout in milliseconds",
    )
    p.add_argument(
        "--goto-options-json", help="Raw JSON object merged into gotoOptions",
    )
    p.add_argument("--user-agent")
    p.add_argument("--cookies-json", help="Raw JSON array for cookies")
    p.add_argument("--authenticate-json", help="Raw JSON object for authenticate")
    p.add_argument(
        "--reject-request-pattern-json", help="Raw JSON array for rejectRequestPattern",
    )
    p.add_argument("--cache-ttl", type=int, default=None)
    p.add_argument("--json", action="store_true", help="Print full API response JSON")
    args = p.parse_args()

    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not token:
        fail("Missing CLOUDFLARE_API_TOKEN")
    if not account_id:
        fail("Missing CLOUDFLARE_ACCOUNT_ID")

    body = build_body(args)
    result = request_markdown(account_id, token, args.cache_ttl, body)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if not result.get("success"):
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.exit(2)

    print(result.get("result", ""))


if __name__ == "__main__":
    main()
