# Model Resource Client (Pattern 3) - Python

Demonstrates giving the AI model agency to access resources through tools.

## Description

This sample demonstrates **Pattern 3: Model Agency**, which shows how to:
- Give the AI model tools to list and read resources
- Let the model decide when to access resources
- Provide dynamic, flexible resource access
- Allow the model to explore and discover resources
- Handle tool results naturally in conversation

This pattern is different from injection patterns (1a, 1b, 1c) because the model actively decides what resources to access rather than having them pre-injected.

## Prerequisites

- Python 3.10 or higher
- pip (Python package installer)
- Ollama installed and running locally (http://127.0.0.1:11434)
- Resource server running on http://localhost:5000

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Make sure Ollama is installed and running:

```bash
ollama serve
```

3. Pull the required model:

```bash
ollama pull qwen2.5:1.5b
```

## Usage

1. Start the resource server (in a separate terminal):

```bash
cd ../../resource-server/python
python server.py
```

2. Run the client:

```bash
python client.py
```

3. Chat with the AI and ask questions about resources.

## Example Queries

- "What resources are available?"
- "What are the company's core values?"
- "Show me the coding standards"
- "What are Alice's preferences?"
- "What framework does the backend project use?"

## Key Features

- Model has **agency** to decide what resources to access
- Tool calls are **transparent** (displayed in console)
- Resource access is **dynamic** (not pre-injected)
- Model can **explore** available resources

## Comparison with Other Patterns

| Pattern | Resource Access | Trust Level | Flexibility | Complexity |
|---------|----------------|-------------|-------------|------------|
| **1a: User Injection** | Pre-injected | User | Low | Low |
| **1b: System Injection** | Pre-injected | System | Low | Low |
| **1c: Hybrid** | Pre-injected | Mixed | Low | High |
| **3: Model Agency (this)** | On-demand | Tool result | High | Medium |

## When to Use This Pattern

✅ **Use when:**
- Model should decide what resources to access
- Resources are discovered dynamically
- You want flexible, exploratory access
- Tool result trust level is appropriate

❌ **Don't use when:**
- Resources must be pre-loaded for context
- You need tight control over what's accessed
- Model shouldn't have discovery capabilities

## Related Samples

- **user-message-injection**: Pattern 1a (user-level pre-injection)
- **system-message-injection**: Pattern 1b (system-level pre-injection)
- **hybrid-attestation**: Pattern 1c (hybrid pre-injection)
- **resource-server**: The server providing resources
- **resource-client**: Direct client without AI model
