.PHONY: help test lint clean

# Default target
help:
	@echo "Block Dotfiles Plugin - Available Commands:"
	@echo ""
	@echo "  make test          - Run all tests"
	@echo "  make lint          - Run shellcheck on hook scripts"
	@echo "  make clean         - Clean up test artifacts"
	@echo ""

# Run tests
test:
	@echo "Running tests..."
	@chmod +x scripts/*.sh
	@bats tests/*.bats

# Run shellcheck on hook scripts (if available)
lint:
	@if command -v shellcheck > /dev/null 2>&1; then \
		echo "Running shellcheck on hook scripts..."; \
		shellcheck scripts/*.sh; \
		echo "✓ Lint complete"; \
	else \
		echo "shellcheck not installed. Install with: brew install shellcheck"; \
		exit 1; \
	fi

# Clean up any test artifacts
clean:
	@echo "Cleaning up test artifacts..."
	@find . -name "*.log" -delete
	@echo "✓ Clean complete"
