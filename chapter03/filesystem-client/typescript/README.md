# MCP FileSystem Resource Client - TypeScript (HTTP Transport)

A simple MCP client that demonstrates reading dynamically-loaded resources from a filesystem resource server.

## Description

This client demonstrates:
- Listing dynamically-loaded resources from a folder
- Reading text resources (markdown, JSON, text files)
- Reading binary resources (images as base64-encoded data)
- Verifying binary file integrity (PNG header validation)

## Prerequisites

- Node.js 18 or higher
- npm (Node package manager)
- FileSystem resource server running on http://localhost:5002 (see `chapter03/filesystem-server/typescript`)

## Installation

Install the required dependencies:

```bash
npm install
```

## Usage

1. Start the filesystem resource server (in another terminal):

```bash
cd ../filesystem-server/typescript
npm install
npm run dev
```

2. Run the client:

```bash
# Build the TypeScript code
npm run build

# Run the built client
npm start

# Or run directly in development mode
npm run dev
```

## Example Output

```
=== FileSystem Resource Client ===

Connected to FileSystem server.

Found 4 resources:

  URI: file://resources/readme.md
  Name: readme.md
  MIME: text/markdown
  Description: File: readme.md (1.2 KB)

  URI: file://resources/config.json
  Name: config.json
  MIME: application/json
  Description: File: config.json (234 B)

  URI: file://resources/notes.txt
  Name: notes.txt
  MIME: text/plain
  Description: File: notes.txt (456 B)

  URI: file://resources/logo.png
  Name: logo.png
  MIME: image/png
  Description: File: logo.png (789 B)

============================================================
Reading each resource:

--- readme.md (text/markdown) ---
[TEXT RESOURCE]
# Sample Resources

This folder contains sample resources...

--- config.json (application/json) ---
[TEXT RESOURCE]
{
  "appName": "FileSystem Resource Server Demo",
  ...
}

--- notes.txt (text/plain) ---
[TEXT RESOURCE]
Development Notes
==================
...

--- logo.png (image/png) ---
[BINARY RESOURCE (base64)]
Base64 length: 1052 chars
Preview: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQ...
Decoded: 789 bytes
Valid PNG header: true

=== Test Complete ===
```

## Project Structure

```
typescript/
├── src/
│   └── client.ts       # Main client implementation
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── .gitignore          # Git ignore patterns
└── README.md           # This file
```

## Architecture

This client uses:
- **MCP TypeScript SDK** (`@modelcontextprotocol/sdk`) for MCP protocol implementation
- **Streaming HTTP transport** for communication with the MCP server
- **Buffer API** for base64 decoding and binary file validation
- **Modern TypeScript** with ES modules and strict type checking

## Key Features

### Text Resources
The client automatically detects text resources (based on MIME type) and displays their content. Text preview is truncated to 200 characters for readability.

### Binary Resources
Binary resources are:
- Displayed with base64 encoding information
- Decoded to show byte count
- Validated (e.g., PNG header verification)

### Dynamic Discovery
The filesystem server dynamically discovers files, so you can:
1. Add new files to the server's resource folder
2. Restart the server
3. Run this client to see the new resources

## Development

### Building

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### Cleaning Build Artifacts

```bash
npm run clean
```

## Troubleshooting

### Connection refused
Make sure the filesystem resource server is running on http://localhost:5002

### Module not found
Make sure all dependencies are installed:
```bash
npm install
```

### TypeScript compilation errors
Make sure you're using Node.js 18 or higher:
```bash
node --version
```

## Comparison with C# Implementation

This TypeScript implementation is functionally equivalent to the C# implementation:

- **C#**: Uses `ModelContextProtocol.Client` with HttpClientTransport
- **TypeScript**: Uses `@modelcontextprotocol/sdk` with StreamableHTTPClientTransport

Both implementations:
- Connect to the same filesystem server
- List and read dynamically discovered resources
- Handle both text and binary resources
- Validate binary file integrity

## License

MIT
