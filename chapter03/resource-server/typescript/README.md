# MCP Resource Server - TypeScript (HTTP Transport)

A Model Context Protocol (MCP) server that demonstrates static and templated resources via HTTP transport.

## Description

This server demonstrates:
- **Static resources**: Company handbook, coding standards, API documentation
- **Resource templates**: User preferences and project settings with URI parameters
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

# Run the built server
npm start

# Or run directly in development mode
npm run dev
```

The server will start on http://localhost:5000/mcp

### Available Resources

**Static Resources:**
- `docs://company/handbook` - Company handbook with policies and guidelines
- `docs://company/coding-standards` - Coding standards and best practices
- `docs://api/endpoints` - API endpoint documentation (JSON)

**Resource Templates:**
- `config://user/{userId}/preferences` - User-specific preferences (e.g., `config://user/alice/preferences`)
- `config://project/{projectId}/settings` - Project-specific settings (e.g., `config://project/backend/settings`)

## Testing with a Client

To test this server, use one of the resource clients:
- `chapter03/resource-client/typescript` - Basic resource demonstration
- `chapter03/model-resource-client/typescript` - AI agent with resource access

Example:
```bash
# In another terminal, run the resource-client
cd ../resource-client/typescript
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
- **TypeScript** with ES modules and strict type checking
- **Static resources** - Predefined content served directly
- **Resource templates** - Dynamic content based on URI parameters

## Resource Types

### Static Resources
Static resources return fixed content. They're ideal for:
- Documentation that doesn't change per-request
- Configuration files
- Reference data

### Resource Templates
Resource templates accept parameters in the URI and return dynamic content. They're ideal for:
- User-specific data
- Project-specific configurations
- Any parameterized content

## Development

### Building

```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `dist/`.

### Running in Development Mode

```bash
npm run dev
```

This uses `tsx` to run TypeScript files directly without compilation.

### Cleaning Build Artifacts

```bash
npm run clean
```

## Troubleshooting

### Port already in use
If port 5000 is already in use, you can modify the port in `src/server.ts` or ensure no other service is using port 5000.

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

- **C#**: Uses ASP.NET Core with `ModelContextProtocol.Server` and attribute-based resource definitions
- **TypeScript**: Uses MCP SDK with method-based resource registration and HTTP server

Both implementations:
- Provide the same static resources and templates
- Use HTTP transport
- Support the MCP resource protocol
- Serve identical content

## License

MIT
