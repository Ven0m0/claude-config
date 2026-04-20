#!/usr/bin/env python3
import argparse
import http.client
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = (
    "https://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering/crawl"
)
TERMINAL = {
    "completed",
    "errored",
    "cancelled_by_user",
    "cancelled_due_to_timeout",
    "cancelled_due_to_limits",
}


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


_conn_pool = {}


def _get_connection(host):
    if host not in _conn_pool:
        context = ssl.create_default_context()
        _conn_pool[host] = http.client.HTTPSConnection(
            host,
            timeout=180,
            context=context,
        )
    return _conn_pool[host]


def api_request(url, token, method="GET", body=None, _retries=1):
    data = json.dumps(body).encode("utf-8") if body is not None else None

    parsed_url = urllib.parse.urlparse(url)
    host = parsed_url.netloc
    path = parsed_url.path
    if parsed_url.query:
        path += "?" + parsed_url.query

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    if data is not None:
        headers["Content-Length"] = str(len(data))

    conn = _get_connection(host)

    try:
        conn.request(method, path, body=data, headers=headers)
        resp = conn.getresponse()
        resp_data = resp.read()

        if resp.status >= 400:
            detail = resp_data.decode("utf-8", errors="replace")
            fail(f"HTTP {resp.status}: {detail}")

        return json.loads(resp_data.decode("utf-8"))
    except (http.client.HTTPException, OSError) as e:
        # If the keep-alive connection was closed or broken, remove it and retry
        if host in _conn_pool:
            try:
                _conn_pool[host].close()
            except Exception:
                pass
            del _conn_pool[host]

        if _retries > 0:
            return api_request(
                url,
                token,
                method=method,
                body=body,
                _retries=_retries - 1,
            )
        fail(f"Request failed: {e}")


def env():
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not token:
        fail("Missing CLOUDFLARE_API_TOKEN")
    if not account_id:
        fail("Missing CLOUDFLARE_ACCOUNT_ID")
    return account_id, token


def build_create_body(args):
    body = {"url": args.url}
    if args.limit is not None:
        body["limit"] = args.limit
    if args.depth is not None:
        body["depth"] = args.depth
    if args.format:
        body["formats"] = [args.format]
    if args.render is not None:
        body["render"] = args.render

    options = load_json_arg(args.options_json, "--options-json") or {}
    if args.include_external_links:
        options["includeExternalLinks"] = True
    if args.include_subdomains:
        options["includeSubdomains"] = True
    if options:
        body["options"] = options

    goto_options = load_json_arg(args.goto_options_json, "--goto-options-json") or {}
    if args.wait_until:
        goto_options["waitUntil"] = args.wait_until
    if goto_options:
        body["gotoOptions"] = goto_options

    if args.source:
        body["source"] = args.source
    if args.max_age is not None:
        body["maxAge"] = args.max_age
    if args.modified_since is not None:
        body["modifiedSince"] = args.modified_since
    if args.json_options_json is not None:
        body["jsonOptions"] = load_json_arg(
            args.json_options_json,
            "--json-options-json",
        )
    return body


def print_json(data):
    print(json.dumps(data, ensure_ascii=False, indent=2))


def save_json_if_needed(data, out_path):
    if not out_path:
        return
    p = Path(out_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def save_merged_markdown(result_payload, out_path):
    if not out_path:
        return
    records = result_payload.get("records", [])
    parts = []
    for i, rec in enumerate(records, start=1):
        md = rec.get("markdown")
        if not md:
            continue
        parts.append(f"<!-- record {i}: {rec.get('url', '')} -->\n\n{md}\n")
    p = Path(out_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("\n\n".join(parts), encoding="utf-8")


def cmd_start(args):
    account_id, token = env()
    url = BASE.format(account_id=account_id)
    result = api_request(url, token, method="POST", body=build_create_body(args))
    print_json(result)
    save_json_if_needed(result, args.out_json)


def fetch_result(
    account_id,
    token,
    job_id,
    cursor=None,
    limit=None,
    status=None,
    cache_ttl=None,
):
    params = {}
    if cursor is not None:
        params["cursor"] = cursor
    if limit is not None:
        params["limit"] = limit
    if status is not None:
        params["status"] = status
    if cache_ttl is not None:
        params["cacheTTL"] = cache_ttl
    url = BASE.format(account_id=account_id) + "/" + urllib.parse.quote(job_id)
    if params:
        url += "?" + urllib.parse.urlencode(params)
    return api_request(url, token)


def summarize_payload(payload):
    return {
        "id": payload.get("id"),
        "status": payload.get("status"),
        "browserSecondsUsed": payload.get("browserSecondsUsed"),
        "total": payload.get("total"),
        "finished": payload.get("finished"),
        "queued": payload.get("queued"),
        "skipped": payload.get("skipped"),
        "errored": payload.get("errored"),
        "recordsReturned": len(payload.get("records", []) or []),
        "cursor": payload.get("cursor"),
    }


def cmd_results(args):
    account_id, token = env()
    result = fetch_result(
        account_id,
        token,
        args.job_id,
        args.cursor,
        args.limit,
        args.status,
        args.cache_ttl,
    )
    payload = result.get("result", {})
    if args.summary:
        print_json(summarize_payload(payload))
    else:
        print_json(result)
    save_json_if_needed(result, args.out_json)
    save_merged_markdown(payload, args.out_markdown)


def cmd_wait(args):
    account_id, token = env()
    attempts = 0
    while True:
        attempts += 1
        result = fetch_result(account_id, token, args.job_id, limit=1)
        payload = result.get("result", {})
        status = payload.get("status")
        print(
            json.dumps(
                {
                    "attempt": attempts,
                    "job_id": args.job_id,
                    "status": status,
                    "finished": payload.get("finished"),
                    "total": payload.get("total"),
                    "browserSecondsUsed": payload.get("browserSecondsUsed"),
                },
                ensure_ascii=False,
            ),
            flush=True,
        )
        if status in TERMINAL:
            if args.fetch_results:
                final_result = fetch_result(
                    account_id,
                    token,
                    args.job_id,
                    limit=args.limit,
                    status=args.status,
                    cache_ttl=args.cache_ttl,
                )
                final_payload = final_result.get("result", {})
                if args.summary:
                    print_json(summarize_payload(final_payload))
                else:
                    print_json(final_result)
                save_json_if_needed(final_result, args.out_json)
                save_merged_markdown(final_payload, args.out_markdown)
            break
        time.sleep(args.poll_seconds)


def cmd_cancel(args):
    account_id, token = env()
    url = BASE.format(account_id=account_id) + "/" + urllib.parse.quote(args.job_id)
    result = api_request(url, token, method="DELETE")
    print_json(result)


def cmd_run(args):
    account_id, token = env()
    start = api_request(
        BASE.format(account_id=account_id),
        token,
        method="POST",
        body=build_create_body(args),
    )
    print_json(start)
    save_json_if_needed(start, args.out_json if not args.wait else None)
    if not args.wait:
        return
    job_id = start.get("result")
    if not job_id:
        fail("No job id returned")
    wait_args = argparse.Namespace(
        job_id=job_id,
        poll_seconds=args.poll_seconds,
        fetch_results=args.fetch_results,
        limit=args.results_limit,
        status=args.results_status,
        cache_ttl=args.results_cache_ttl,
        out_json=args.out_json,
        out_markdown=args.out_markdown,
        summary=args.summary,
    )
    cmd_wait(wait_args)


def main():
    p = argparse.ArgumentParser(description="Call Cloudflare Browser Rendering /crawl")
    sub = p.add_subparsers(dest="cmd", required=True)

    common_create = argparse.ArgumentParser(add_help=False)
    common_create.add_argument("--url", required=True)
    common_create.add_argument("--depth", type=int)
    common_create.add_argument("--limit", type=int)
    common_create.add_argument("--format", choices=["markdown", "html", "json"])
    common_create.add_argument(
        "--render",
        type=lambda x: x.lower() == "true",
        choices=[True, False],
        default=None,
    )
    common_create.add_argument("--include-external-links", action="store_true")
    common_create.add_argument("--include-subdomains", action="store_true")
    common_create.add_argument(
        "--wait-until",
        choices=["load", "domcontentloaded", "networkidle0", "networkidle2"],
    )
    common_create.add_argument("--goto-options-json")
    common_create.add_argument("--options-json")
    common_create.add_argument("--source", choices=["all", "sitemaps", "links"])
    common_create.add_argument("--max-age", type=int)
    common_create.add_argument("--modified-since", type=int)
    common_create.add_argument("--json-options-json")
    common_create.add_argument("--out-json")

    s = sub.add_parser("start", parents=[common_create])
    s.set_defaults(func=cmd_start)

    s = sub.add_parser("run", parents=[common_create])
    s.add_argument("--wait", action="store_true")
    s.add_argument("--poll-seconds", type=int, default=5)
    s.add_argument(
        "--fetch-results",
        action="store_true",
        help="After wait, fetch final results",
    )
    s.add_argument("--results-limit", type=int)
    s.add_argument(
        "--results-status",
        choices=[
            "queued",
            "errored",
            "completed",
            "disallowed",
            "skipped",
            "cancelled",
        ],
    )
    s.add_argument("--results-cache-ttl", type=int)
    s.add_argument("--out-markdown")
    s.add_argument("--summary", action="store_true")
    s.set_defaults(func=cmd_run)

    s = sub.add_parser("results")
    s.add_argument("--job-id", required=True)
    s.add_argument("--cursor", type=int)
    s.add_argument("--limit", type=int)
    s.add_argument(
        "--status",
        choices=[
            "queued",
            "errored",
            "completed",
            "disallowed",
            "skipped",
            "cancelled",
        ],
    )
    s.add_argument("--cache-ttl", type=int)
    s.add_argument("--out-json")
    s.add_argument("--out-markdown")
    s.add_argument("--summary", action="store_true")
    s.set_defaults(func=cmd_results)

    s = sub.add_parser("wait")
    s.add_argument("--job-id", required=True)
    s.add_argument("--poll-seconds", type=int, default=5)
    s.add_argument("--fetch-results", action="store_true")
    s.add_argument("--limit", type=int)
    s.add_argument(
        "--status",
        choices=[
            "queued",
            "errored",
            "completed",
            "disallowed",
            "skipped",
            "cancelled",
        ],
    )
    s.add_argument("--cache-ttl", type=int)
    s.add_argument("--out-json")
    s.add_argument("--out-markdown")
    s.add_argument("--summary", action="store_true")
    s.set_defaults(func=cmd_wait)

    s = sub.add_parser("cancel")
    s.add_argument("--job-id", required=True)
    s.set_defaults(func=cmd_cancel)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
