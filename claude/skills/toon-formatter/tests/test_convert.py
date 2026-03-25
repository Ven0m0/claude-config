import pytest
import os
import sys

# Ensure module is in path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import importlib.util

spec = importlib.util.spec_from_file_location("toon_convert", "claude/skills/toon-formatter/toon-convert.py")
toon_convert = importlib.util.module_from_spec(spec)
spec.loader.exec_module(toon_convert)

def test_needs_quote():
    assert toon_convert.needs_quote(None, ",") == False
    assert toon_convert.needs_quote(True, ",") == False
    assert toon_convert.needs_quote(False, ",") == False
    assert toon_convert.needs_quote(123, ",") == False
    assert toon_convert.needs_quote(1.23, ",") == False

    assert toon_convert.needs_quote("true", ",") == True
    assert toon_convert.needs_quote("false", ",") == True
    assert toon_convert.needs_quote("null", ",") == True
    assert toon_convert.needs_quote("other", ",") == False

    assert toon_convert.needs_quote("", ",") == True
    assert toon_convert.needs_quote("  padded  ", ",") == True
    assert toon_convert.needs_quote("hello:world", ",") == True
    assert toon_convert.needs_quote("hello,world", ",") == True
    assert toon_convert.needs_quote("hello|world", "|") == True

    assert toon_convert.needs_quote("123", ",") == True
    assert toon_convert.needs_quote("-123", ",") == True
    assert toon_convert.needs_quote("-", ",") == True

def test_fmt():
    assert toon_convert.fmt(None, ",") == "null"
    assert toon_convert.fmt(True, ",") == "true"
    assert toon_convert.fmt(False, ",") == "false"
    assert toon_convert.fmt(123, ",") == "123"
    assert toon_convert.fmt(1.23, ",") == "1.23"
    assert toon_convert.fmt("normal", ",") == "normal"
    assert toon_convert.fmt("true", ",") == '"true"'
