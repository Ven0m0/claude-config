import re

file_path = "plugins/conserve/skills/context-optimization/condition_based_optimizer.py"

with open(file_path, "r") as f:
    content = f.read()

# Define the new implementation
new_method = '''    async def wait_for_condition(
        self,
        condition: Callable[[], Any],
        description: str,
        timeout_ms: int = 30000,
        poll_interval_ms: int = 10,
    ) -> Any:
        """Wait for a condition to be met with proper error handling.

        This is the core condition-based waiting function that replaces
        arbitrary sleep() calls with intelligent polling.
        """
        start_time = time.time()
        timeout_seconds = timeout_ms / 1000
        current_poll_interval = poll_interval_ms / 1000
        max_poll_interval = 1.0  # Cap poll interval at 1 second

        self.logger.info(f"Waiting for condition: {description}")

        while True:
            try:
                # Support async conditions if provided
                if asyncio.iscoroutinefunction(condition):
                    result = await condition()
                else:
                    result = condition()
                    if asyncio.iscoroutine(result):
                        result = await result

                # Check if condition is met (truthy result)
                if result:
                    elapsed_ms = (time.time() - start_time) * 1000
                    self.logger.info(
                        f"Condition met: {description} (elapsed: {elapsed_ms:.0f}ms)",
                    )
                    return result
            except Exception as e:
                self.logger.warning(f"Condition check failed: {e}")

            if time.time() - start_time > timeout_seconds:
                # Report expected timeout duration as per tests requirement
                msg = f"Timeout waiting for {description} after {timeout_ms}ms"
                raise TimeoutError(msg)

            await asyncio.sleep(current_poll_interval)

            # Exponential backoff for next poll
            current_poll_interval = min(current_poll_interval * 1.5, max_poll_interval)'''

# Regex to find the method
# Matches async def wait_for_condition... until the next async def or end of class
pattern = r"    async def wait_for_condition\(.*?\n    async def"
# We need DOTALL to match newlines
# But be careful not to consume too much.
# The next method is optimize_with_conditions (async def)

# Let's try to match specifically  and replace everything until
regex = r"(    async def wait_for_condition[\s\S]*?)(?=\n    async def optimize_with_conditions)"

match = re.search(regex, content)
if match:
    print("Found match, replacing...")
    new_content = content.replace(match.group(1), new_method)
    with open(file_path, "w") as f:
        f.write(new_content)
    print("File updated.")
else:
    print("Match not found!")
    # Debug: print snippet
    start = content.find("async def wait_for_condition")
    if start != -1:
        print(f"Snippet found at {start}:")
        print(content[start:start+200])
    else:
        print("Method definition not found at all.")
