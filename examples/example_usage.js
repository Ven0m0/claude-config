#!/usr/bin/env node
/**
 * Example script demonstrating how to use the Claude configuration
 */

const fs = require("fs");
const path = require("path");

// Get the base directory
const BASE_DIR = path.join(__dirname, "..");

/**
 * Load the main Claude configuration
 */
function loadConfig() {
	const configPath = path.join(BASE_DIR, ".claude", "config.json");
	const configData = fs.readFileSync(configPath, "utf8");
	return JSON.parse(configData);
}

/**
 * Load a system prompt by name
 */
function loadPrompt(promptName) {
	const promptPath = path.join(
		BASE_DIR,
		".claude",
		"prompts",
		`${promptName}.md`,
	);
	return fs.readFileSync(promptPath, "utf8");
}

/**
 * Load API settings
 */
function loadApiSettings() {
	const settingsPath = path.join(
		BASE_DIR,
		".claude",
		"settings",
		"api_settings.json",
	);
	const settingsData = fs.readFileSync(settingsPath, "utf8");
	return JSON.parse(settingsData);
}

async function main() {
	// Load configuration
	const config = loadConfig();
	console.log(`Model: ${config.model}`);
	console.log(`Max Tokens: ${config.max_tokens}`);
	console.log(`Temperature: ${config.temperature}`);

	// Load a prompt
	const codingPrompt = loadPrompt("coding_assistant");
	console.log(
		`\nLoaded prompt (first 100 chars):\n${codingPrompt.substring(0, 100)}...`,
	);

	// Load API settings
	const apiSettings = loadApiSettings();
	console.log(`\nAPI Base URL: ${apiSettings.base_url}`);
	console.log(`Timeout: ${apiSettings.timeout}s`);

	// Example: Making a request (pseudo-code)
	// This would require: npm install @anthropic-ai/sdk
	/*
    const Anthropic = require('@anthropic-ai/sdk');
    
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const message = await anthropic.messages.create({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        system: codingPrompt,
        messages: [
            {
                role: 'user',
                content: 'Write a JavaScript function to calculate fibonacci numbers'
            }
        ]
    });
    
    console.log(message.content);
    */
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { loadConfig, loadPrompt, loadApiSettings };
