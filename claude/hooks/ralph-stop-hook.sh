#!/usr/bin/env bash
set -euo pipefail

RALPH_DIR=".ralph"
STATE_FILE="${RALPH_DIR}/state.md"
TRANSCRIPT_FILE="${RALPH_DIR}/transcript.md"
GOALS_XML="${RALPH_DIR}/goals.xml"

get_state_value() {
    local key="$1"
    if [[ ! -f "$STATE_FILE" ]]; then
        echo ""
        return 1
    fi

    local value=$(sed -n '1,/^---$/p' "$STATE_FILE" | grep "^${key}:" | sed "s/^${key}:[[:space:]]*//" | tr -d '"' || echo "")
    echo "$value"
}

set_state_value() {
    local key="$1"
    local value="$2"

    if [[ ! -f "$STATE_FILE" ]]; then
        return 1
    fi

    if grep -q "^${key}:" "$STATE_FILE"; then
        sed -i '' "s/^${key}:.*/${key}: \"${value}\"/" "$STATE_FILE"
    else
        sed -i '' "/^---$/a\\
${key}: \"${value}\"" "$STATE_FILE"
    fi
}

has_completion_promise() {
    if [[ ! -f "$TRANSCRIPT_FILE" ]]; then
        return 1
    fi

    if grep -q "<promise>ALL GOALS COMPLETE</promise>" "$TRANSCRIPT_FILE"; then
        return 0
    fi

    return 1
}

needs_goal_update() {
    local planning_doc="$1"
    local goals_xml="$2"

    if [[ ! -f "$goals_xml" ]]; then
        return 0
    fi

    if [[ ! -f "$planning_doc" ]]; then
        return 1
    fi

    local goals_mtime=$(stat -f "%m" "$goals_xml" 2>/dev/null || echo "0")
    local planning_mtime=$(stat -f "%m" "$planning_doc" 2>/dev/null || echo "0")

    if [[ "$planning_mtime" -gt "$goals_mtime" ]]; then
        return 0
    fi

    return 1
}

update_goals() {
    local planning_doc="$1"
    local goals_xml="$2"

    if [[ ! -f "$planning_doc" ]]; then
        echo "Warning: Planning doc not found: $planning_doc" >&2
        return 1
    fi

    python3 scripts/convert-planning.py "$planning_doc" > "$goals_xml"
    echo "Goals updated from $planning_doc"
}

get_current_goal() {
    local goals_xml="$1"

    if [[ ! -f "$goals_xml" ]]; then
        echo ""
        return 1
    fi

    python3 - <<'PYTHON'
import sys
import xml.etree.ElementTree as ET

try:
    tree = ET.parse(sys.argv[1])
    root = tree.getroot()

    for goal in root.findall('goal'):
        if goal.get('status') == 'todo':
            goal_id = goal.get('id')
            title = goal.find('title').text if goal.find('title') is not None else ''
            description = goal.find('description').text if goal.find('description') is not None else ''
            promise = goal.find('promise').text if goal.find('promise') is not None else ''

            print(f"GOAL_ID: {goal_id}")
            print(f"TITLE: {title}")
            print(f"DESCRIPTION: {description}")
            print(f"PROMISE: {promise}")
            sys.exit(0)

    print("NO_PENDING_GOALS")
    sys.exit(0)

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON
}

main() {
    local status=$(get_state_value "status" || echo "")
    local iteration=$(get_state_value "iteration" || echo "0")
    local max_iterations=$(get_state_value "max_iterations" || echo "10")
    local planning_doc=$(get_state_value "planning_doc" || echo "")
    local goals_xml=$(get_state_value "goals_xml" || echo "${GOALS_XML}")

    if [[ -z "$status" || "$status" == "initialized" ]]; then
        echo "Ralph Planner: No active session - allowing exit"
        exit 0
    fi

    if [[ "$status" == "complete" ]]; then
        echo "Ralph Planner: Already marked complete - allowing exit"
        exit 0
    fi

    if [[ "$status" == "running" || "$status" == "in_progress" ]]; then
        if has_completion_promise; then
            echo "Ralph Planner: Completion promise detected - marking complete and allowing exit"

            total_goals=$(python3 - <<'PYTHON'
import sys
import xml.etree.ElementTree as ET
try:
    tree = ET.parse(sys.argv[1])
    root = tree.getroot()
    print(len(root.findall('goal')))
except:
    print(0)
PYTHON
)

            completed_goals=$(python3 - <<'PYTHON'
import sys
import xml.etree.ElementTree as ET
try:
    tree = ET.parse(sys.argv[1])
    root = tree.getroot()
    print(len(root.findall("goal[@status='done']")))
except:
    print(0)
PYTHON
)

            if [[ "$total_goals" -gt 0 && "$completed_goals" -eq "$total_goals" ]]; then
                set_state_value "status" "complete"
                exit 0
            else
                echo "Warning: Promise detected but not all goals complete ($completed_goals/$total_goals)" >&2
                exit 1
            fi
        fi

        if [[ -n "$planning_doc" && -n "$goals_xml" ]]; then
            if needs_goal_update "$planning_doc" "$goals_xml"; then
                update_goals "$planning_doc" "$goals_xml"
            fi
        fi

        local current_goal_info=$(get_current_goal "$goals_xml" || echo "")

        if echo "$current_goal_info" | grep -q "NO_PENDING_GOALS"; then
            echo "Ralph Planner: All goals complete - allowing exit"
            set_state_value "status" "complete"
            exit 0
        fi

        local next_iteration=$((iteration + 1))
        set_state_value "iteration" "$next_iteration"
        set_state_value "phase" "execution"

        echo "Ralph Planner: Iteration ${next_iteration}/${max_iterations} - blocking exit to continue loop"
        exit 1
    fi

    if [[ "$iteration" -ge "$max_iterations" ]]; then
        echo "Ralph Planner: Max iterations reached (${iteration}/${max_iterations}) - allowing exit"
        exit 0
    fi

    echo "Ralph Planner: Unknown state (${status}) - allowing exit"
    exit 0
}

main "$@"
