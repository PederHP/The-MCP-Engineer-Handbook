# FileSystem Resource Client - Python (HTTP Transport)

A client that demonstrates consuming dynamic file-based resources from an MCP filesystem server.

## Description

This client demonstrates:
- Listing dynamically-loaded resources from a folder
- Reading text resources (markdown, JSON, plain text)
- Reading binary resources (images as base64-encoded blobs)
- Verifying binary content integrity (PNG header validation)

## Prerequisites

- Python 3.10 or higher
- pip (Python package installer)
- FileSystem server running on http://localhost:5002

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

1. First, start the filesystem server (in a separate terminal):

```bash
cd ../filesystem-server/python
python server.py
```

2. Then run the client:

```bash
python client.py
```

## What the Client Does

### 1. List All Resources
The client connects to the server and lists all files in the resource folder:
- Shows URI, name, MIME type, and file size for each resource
- Resources are discovered dynamically (no hardcoded list)

### 2. Read Each Resource
For each resource, the client:
- Reads the content using the resource URI
- Displays text resources with a preview (first 200 characters)
- For binary resources:
  - Shows base64-encoded length
  - Shows a preview of the base64 data
  - Decodes to show byte count
  - For PNG images, verifies the PNG header magic bytes

## Example Output

```
=== FileSystem Resource Client ===

Connected to FileSystem server.

Found 4 resources:

  URI: file://resources/readme.md
  Name: readme.md
  MIME: text/markdown
  Description: File: readme.md (1.2 KB)

  URI: file://resources/logo.png
  Name: logo.png
  MIME: image/png
  Description: File: logo.png (67 B)

============================================================
Reading each resource:

--- readme.md (text/markdown) ---
[TEXT RESOURCE]
# Sample Resources

This folder contains sample resources for the FileSystem Resource Server demo.
...

--- logo.png (image/png) ---
[BINARY RESOURCE (base64)]
Base64 length: 92 chars
Preview: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12P4...
Decoded: 69 bytes
Valid PNG header: True

=== Test Complete ===
```

## Architecture

This client uses:
- **MCP Python SDK** (`mcp` package) for protocol implementation
- **HTTP transport** for communication with the MCP server
- **Async/await** pattern for handling requests
- **Base64 decoding** for binary content validation

## Configuration

You can modify the following settings in `client.py`:

- **Server URL**: Change `http://localhost:5002` to connect to a different server
- **Preview length**: Modify the 200-character limit for text previews

## Related Samples

- **filesystem-server**: The server that provides dynamic file-based resources
- **resource-client**: Shows reading static/templated resources (different approach)
