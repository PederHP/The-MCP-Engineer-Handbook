# Model Resource Client (Pattern 3) - TypeScript

An AI-powered MCP client that gives the model agency over resource access through tool calling.

## Description

This sample demonstrates **Pattern 3**: giving the AI model agency over resource operations. The model can decide when to list resources, list templates, or read specific resources based on user questions.

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

Chat with the AI about company resources!

## License

MIT
