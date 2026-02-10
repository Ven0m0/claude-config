#!/bin/bash
# JSON with escaped quotes
json='{ "comment": "contains \"command\": here", "command": "real" }'
echo "JSON: $json"
temp="${json#*\"command\"}"
echo "Temp: $temp"

# Try without backslash
json2='{ "comment": "contains "command": here", "command": "real" }'
echo "JSON2: $json2"
temp2="${json2#*\"command\"}"
echo "Temp2: $temp2"
