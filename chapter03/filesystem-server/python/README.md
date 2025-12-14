# FileSystem Resource Server - Python (HTTP Transport)

A dynamic resource server that serves files from a folder as MCP resources.

## Description

This server demonstrates:
- **Dynamic resource loading**: Files are discovered at runtime (no hardcoded list)
- **Binary resource support**: Images and other binary files served as base64-encoded blobs
- **Text resource support**: Text files served as plain text
- **MIME type detection**: Automatic MIME type inference from file extensions
- **Path security**: Prevents path traversal attacks

## Prerequisites

- Python 3.10 or higher
- pip (Python package installer)

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Start the server with default sample resources:

```bash
python server.py
```

Or specify a custom folder:

```bash
python server.py /path/to/your/resources
```

The server will:
1. Create sample resources if the folder doesn't exist
2. Start on http://localhost:5002
3. Dynamically serve all files in the folder as resources

## Default Sample Resources

If no folder is specified or the folder doesn't exist, the server creates sample files:
- `readme.md` - Markdown documentation
- `config.json` - JSON configuration
- `notes.txt` - Plain text notes
- `logo.png` - 1x1 red pixel PNG image

## Supported File Types

### Text Files (served as TextContent)
- `.txt`, `.md`, `.html`, `.css`, `.xml`
- `.json`, `.js`
- `.py`, `.cs`, `.ts`, `.go`, `.java`, etc.
- `.yaml`, `.yml`

### Binary Files (served as BlobContent with base64 encoding)
- `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`
- `.pdf`, `.zip`
- Any other file types not recognized as text

## Security

The server includes path traversal protection:
- URIs are validated to prevent `../` attacks
- All resolved paths must be within the resource folder
- Invalid paths return an error

## Testing the Server

You can test the server using the filesystem-client sample:

```bash
# In another terminal
cd ../filesystem-client/python
python client.py
```

## Architecture

This server uses:
- **MCP Python SDK** (`mcp` package) for protocol implementation
- **HTTP transport** with Server-Sent Events (SSE)
- **Starlette** for the web server
- **Uvicorn** as the ASGI server
- **Dynamic file discovery** at runtime

## Port Configuration

This server runs on **port 5002** (different from resource-server on 5000) to avoid conflicts.

You can modify the port in `server.py`:
```python
config = uvicorn.Config(web_app, host="0.0.0.0", port=5002, log_level="info")
```

## Adding Your Own Files

Simply add files to the resource folder and restart the server. All files will be automatically:
- Discovered and listed as resources
- Assigned appropriate MIME types
- Served as text or binary content based on type

## Related Samples

- **filesystem-client**: Demonstrates how to consume resources from this server
- **resource-server**: Shows attribute-based static resources (different approach)
