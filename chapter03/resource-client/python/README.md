# MCP Resource Client - Python (HTTP Transport)

A client that demonstrates how to consume resources from an MCP resource server.

## Description

This client demonstrates:
- Listing static resources
- Listing resource templates (parameterized resources)
- Reading specific resources by URI
- Reading templated resources with parameters filled in

## Prerequisites

- Python 3.10 or higher
- pip (Python package installer)
- An MCP resource server running on http://localhost:5000 (e.g., the resource-server sample)

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

1. First, start the resource server (in a separate terminal):

```bash
cd ../resource-server/python
python server.py
```

2. Then run the client:

```bash
python client.py
```

## What the Client Does

The client demonstrates different resource access patterns:

### 1. List Static Resources
Shows all available resources with fixed URIs:
- Company Handbook
- Coding Standards
- API Endpoints

### 2. List Resource Templates
Shows all available resource templates with parameterized URIs:
- User Preferences (requires userId)
- Project Settings (requires projectId)

### 3. Read Static Resources
Reads and displays the Company Handbook content (with truncation for readability).

### 4. Read Templated Resources
Demonstrates reading templated resources by constructing the full URI:
- User preferences for "alice"
- Project settings for "backend"

## Example Output

```
=== MCP Resource Client Demo ===

📚 Available Resources:
--------------------------------------------------
  Name: Company Handbook
  URI:  docs://company/handbook
  Type: text/markdown
  Desc: The company handbook with policies and guidelines

📋 Available Resource Templates:
--------------------------------------------------
  Name: User Preferences
  URI:  config://user/{userId}/preferences
  Type: application/json
  Desc: User-specific preferences and settings

📖 Reading 'Company Handbook' resource:
--------------------------------------------------
# Company Handbook

## Mission Statement
We build tools that empower developers...
[... truncated ...]

👤 Reading User Preferences for 'alice':
--------------------------------------------------
{
  "theme": "dark",
  "language": "en",
  "notifications": true,
  "timezone": "America/New_York"
}
```

## Architecture

This client uses:
- **MCP Python SDK** (`mcp` package) for protocol implementation
- **HTTP transport** for communication with the MCP server
- **Async/await** pattern for handling requests

## Configuration

You can modify the following settings in `client.py`:

- **Server URL**: Change `http://localhost:5000` to connect to a different server
- **Resources to read**: Modify the URIs to read different resources

## Related Samples

- **resource-server**: The server that provides resources consumed by this client
- **model-resource-client**: Shows how to give an AI model agency to access resources
- **user-message-injection**: Demonstrates injecting resource content into AI conversations
