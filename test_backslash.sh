#!/bin/bash
var='a\"b'
echo "Original: $var"
# Pattern is quote
res="${var#*\"}"
echo "Result: $res"
