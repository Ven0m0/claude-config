#!/bin/bash
json='{ "fake_command": "echo safe", "command": "real" }'
temp="${json#*\"command\"}"
echo "Original: $json"
echo "Temp: $temp"
