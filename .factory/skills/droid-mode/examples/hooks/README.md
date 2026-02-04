# Hooks (optional)

Droid Mode is intentionally implemented as a **Skill-first** integration.

If you want to enforce a policy such as:

- “Do not call raw `mcp__*` tools directly; use `droid-mode` scripts instead”

…you can add a **PreToolUse** hook and gate decisions there.

Implementation details (hook payload format and the expected allow/deny response) can vary by Droid version, so treat any hook you write as **policy code** that should be validated in your environment.

Reference: Factory Hooks documentation.
