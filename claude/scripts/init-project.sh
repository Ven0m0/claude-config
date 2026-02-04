#!/bin/bash

# Check if git is initialized
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit before Claude checkpoints" || echo "⚠️  No files to commit"
fi
