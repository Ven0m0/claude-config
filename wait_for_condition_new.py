    async def wait_for_condition(
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
            current_poll_interval = min(current_poll_interval * 1.5, max_poll_interval)

    async def optimize_with_conditions(
