# MCP Resource Client - TypeScript (HTTP Transport)

A simple MCP client that demonstrates reading resources and resource templates from an MCP resource server.

## Description

This client demonstrates:
- Listing available static resources
- Listing available resource templates
- Reading static resource content
- Reading templated resources with URI parameters

## Prerequisites

- Node.js 18 or higher
- npm (Node package manager)
- Resource server running on http://localhost:5000 (see `chapter03/resource-server/typescript`)

## Installation

Install the required dependencies:

```bash
npm install
```

## Usage

1. Start the resource server (in another terminal):

```bash
cd ../resource-server/typescript
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
=== MCP Resource Client Demo ===

📚 Available Resources:
--------------------------------------------------
  Name: Company Handbook
  URI:  docs://company/handbook
  Type: text/markdown
  Desc: The company handbook with policies and guidelines

  Name: Coding Standards
  URI:  docs://company/coding-standards
  Type: text/markdown
  Desc: The coding standards and best practices guide

  Name: API Endpoints
  URI:  docs://api/endpoints
  Type: application/json
  Desc: Documentation of available API endpoints

📋 Available Resource Templates:
--------------------------------------------------
  Name: User Preferences
  URI:  config://user/{userId}/preferences
  Type: application/json
  Desc: User-specific preferences and settings

  Name: Project Settings
  URI:  config://project/{projectId}/settings
  Type: application/json
  Desc: Project-specific configuration and settings

📖 Reading 'Company Handbook' resource:
--------------------------------------------------
# Company Handbook

## Mission Statement
We build tools that empower developers to create better software.
...

👤 Reading User Preferences for 'alice':
--------------------------------------------------
{
  "theme": "dark",
  "language": "en",
  "notifications": true,
  "timezone": "America/New_York"
}

🏗️ Reading Project Settings for 'backend':
--------------------------------------------------
{
  "framework": "ASP.NET Core",
  "database": "PostgreSQL",
  "cache": "Redis",
  "testRunner": "xUnit",
  "deployTarget": "Azure"
}

✅ Resource client demo complete!
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
- **Modern TypeScript** with ES modules and strict type checking

## Key Concepts

### Static Resources
Resources with fixed URIs that return predefined content:
- `docs://company/handbook`
- `docs://company/coding-standards`
- `docs://api/endpoints`

### Resource Templates
Resources with URI patterns containing parameters:
- `config://user/{userId}/preferences` - Replace `{userId}` with actual user ID
- `config://project/{projectId}/settings` - Replace `{projectId}` with actual project ID

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
Make sure the resource server is running on http://localhost:5000

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
- Connect to the same resource server
- List and read the same resources
- Support templated resources with parameters
- Produce similar output

## License

MIT
