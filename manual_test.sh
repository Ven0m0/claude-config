#!/bin/bash
json='{
    "tool_input": {
        "note": "Here is a fake \"command\": \"echo safe\"",
        "command": "cat node_modules/package.json"
    }
}'
./plugins/dependency-blocker/scripts/bash-validate.sh <<< "$json"
echo "Exit code: $?"
