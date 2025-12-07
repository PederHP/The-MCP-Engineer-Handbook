# MCP FileSystem Resource Server - TypeScript (HTTP Transport)

A Model Context Protocol (MCP) server that dynamically serves files from a directory as resources.

## Description

This server demonstrates:
- **Dynamic resource loading**: Files are discovered automatically from a folder
- **Binary resource support**: Images and other binary files served as base64-encoded blobs
- **Text resource support**: Text files, markdown, JSON, code files served as text
- **MIME type detection**: Automatic detection from file extensions
- **HTTP transport**: Accessible over HTTP for easy integration

## Prerequisites

- Node.js 18 or higher
- npm (Node package manager)

## Installation

Install the required dependencies:

```bash
npm install
```

## Usage

### Start the server:

```bash
# Build the TypeScript code
npm run build

# Run the built server (default: ./sample-resources)
npm start

# Run with custom folder
npm start /path/to/your/folder

# Or run directly in development mode
npm run dev
```

The server will start on http://localhost:5002/mcp

### Sample Resources

On first run, if the resource folder doesn't exist, the server will create it and populate it with sample files:
- `readme.md` - Sample markdown file
- `config.json` - Sample JSON configuration
- `notes.txt` - Sample text file
- `logo.png` - Sample image (demonstrates binary resource support)

You can add more files to the folder, and they'll automatically appear as resources.

## Testing with a Client

To test this server, use the filesystem-client:

```bash
# In another terminal, run the filesystem-client
cd ../filesystem-client/typescript
npm install
npm run dev
```

## Project Structure

```
typescript/
├── src/
│   └── server.ts       # Main server implementation
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── .gitignore          # Git ignore patterns
└── README.md           # This file
```

## Architecture

This server uses:
- **MCP TypeScript SDK** (`@modelcontextprotocol/sdk`) for MCP protocol implementation
- **HTTP transport** for accessibility over HTTP
- **Dynamic file discovery** - Recursively scans directory for files
- **MIME type detection** - Determines content type from file extension
- **Binary/text handling** - Serves text as text, binaries as base64 blobs
- **Security checks** - Prevents path traversal attacks

## MIME Types

The server automatically detects MIME types for common file extensions:

**Text types**: `.txt`, `.md`, `.html`, `.css`, `.csv`, `.xml`, `.json`, `.js`

**Image types**: `.png`, `.jpg`, `.gif`, `.svg`, `.webp`, `.bmp`

**Code types**: `.cs`, `.py`, `.ts`, `.rs`, `.go`, `.java`, `.cpp`, `.c`, `.h`, `.sh`, `.yaml`

Unknown extensions default to `application/octet-stream`.

## Security

- **Path traversal protection**: The server validates that all file paths stay within the resource folder
- **No hidden files**: Only explicitly added files are served
- **Read-only**: Server only reads files, never writes (except initial sample creation)

## Development

### Building

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev [path-to-folder]
```

### Cleaning Build Artifacts

```bash
npm run clean
```

## Troubleshooting

### Port already in use
If port 5002 is already in use, modify the port in `src/server.ts` or ensure no other service is using port 5002.

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

- **C#**: Uses ASP.NET Core with `ModelContextProtocol.Server` and custom handlers
- **TypeScript**: Uses MCP SDK with custom request handlers and Node.js file system APIs

Both implementations:
- Dynamically discover files in a directory
- Support both text and binary resources
- Use HTTP transport
- Provide the same security protections
- Auto-create sample resources if folder doesn't exist

## License

MIT
