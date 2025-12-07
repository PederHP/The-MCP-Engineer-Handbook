# MCP Resource Server - Python (HTTP Transport)

A resource server that demonstrates static resources and resource templates using the Model Context Protocol.

## Description

This server demonstrates:
- **Static resources**: Documents with fixed URIs (company handbook, coding standards, API docs)
- **Resource templates**: Parameterized URIs like `config://user/{userId}/preferences`
- **Different content types**: Markdown and JSON resources
- **Descriptive metadata**: Each resource includes name, description, and MIME type

## Prerequisites

- Python 3.10 or higher
- pip (Python package installer)

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Start the server:

```bash
python server.py
```

The server will start on http://localhost:5000 and provide:

### Static Resources
- `docs://company/handbook` - Company handbook (markdown)
- `docs://company/coding-standards` - Coding standards (markdown)
- `docs://api/endpoints` - API documentation (JSON)

### Resource Templates
- `config://user/{userId}/preferences` - User preferences (JSON)
- `config://project/{projectId}/settings` - Project settings (JSON)

## Testing the Server

You can test the server using the resource-client sample or by making HTTP requests:

```bash
# List resources
curl http://localhost:5000/sse

# Or use the Python client
cd ../resource-client/python
python client.py
```

## Example Resource Templates

The server provides sample data for specific IDs:

**User Preferences:**
- `alice` - Dark theme, English, New York timezone
- `bob` - Light theme, Spanish, Madrid timezone
- Other IDs - Default system theme

**Project Settings:**
- `frontend` - React, Vite, Vitest
- `backend` - ASP.NET Core, PostgreSQL, Redis
- `mobile` - MAUI, iOS/Android
- Other IDs - Unknown configuration

## Architecture

This server uses:
- **MCP Python SDK** (`mcp` package) for protocol implementation
- **HTTP transport** with Server-Sent Events (SSE)
- **Starlette** for the web server
- **Uvicorn** as the ASGI server
- **Async/await** pattern throughout

## Configuration

You can modify the following settings in `server.py`:

- **Port**: Change `port=5000` in the `uvicorn.Config`
- **Host**: Change `host="0.0.0.0"` to bind to specific interface
- **Resources**: Add more resources by extending the handler functions

## Adding Your Own Resources

To add a new static resource:

1. Add it to the `list_resources()` function
2. Handle it in the `read_resource()` function

To add a new resource template:

1. Add it to the `list_resource_templates()` function
2. Add URI parsing logic in `read_resource()` function
3. Create a helper function to generate the content

## Related Samples

- **resource-client**: Demonstrates how to consume resources from this server
- **model-resource-client**: Shows how to give an AI model agency over resource access
