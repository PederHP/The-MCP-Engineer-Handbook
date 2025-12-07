# User Message Injection - TypeScript

Security pattern demonstration for MCP resource injection.

## Description

This sample demonstrates safe ways to inject MCP resources into AI model context with appropriate security guardrails.

## Prerequisites

- Node.js 18 or higher
- Ollama with qwen3:1.7b model
- Resource server on http://localhost:5000

## Installation

```bash
npm install
ollama pull qwen3:1.7b
```

## Usage

```bash
npm run dev
```

Follow the interactive prompts to see how resource injection works with different security patterns.

## License

MIT
