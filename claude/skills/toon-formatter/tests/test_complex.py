import os
import sys

# Ensure module is in path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
import importlib.util

spec = importlib.util.spec_from_file_location(
    "toon_convert", "claude/skills/toon-formatter/toon-convert.py",
)
toon_convert = importlib.util.module_from_spec(spec)
spec.loader.exec_module(toon_convert)


def test_enc():
    data = {
        "a": "true",
        "b": "false",
        "c": "null",
        "d": "other",
        "e": True,
        "f": False,
        "g": None,
        "h": 123,
        "i": 123.45,
        "j": "123",
        "k": ["true", "false", "null", "other"],
        "l": {"m": "true"},
    }

    expected = """a: "true"
b: "false"
c: "null"
d: other
e: true
f: false
g: null
h: 123
i: 123.45
j: "123"
k: [4]: "true","false","null",other
l:
  m: "true\""""

    assert toon_convert.enc(data, 2, ",") == expected
