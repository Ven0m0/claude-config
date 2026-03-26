#!/bin/bash

gemini extensions install https://github.com/gemini-cli-extensions/conductor --auto-update --consent --pre-release
gemini extensions install https://github.com/gemini-cli-extensions/code-review --auto-update --consent --pre-release
gemini extensions install https://github.com/gemini-cli-extensions/jules --auto-update --consent --pre-release

gemini extensions install https://github.com/gemini-cli-extensions/ralph --auto-update --consent --pre-release
gemini extensions install https://github.com/gemini-cli-extensions/mcp-toolbox --auto-update --consent --pre-release

gemini extensions update --all
