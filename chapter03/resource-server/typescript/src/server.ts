#!/usr/bin/env node

/**
 * MCP Resource Server - HTTP Transport
 *
 * This server demonstrates:
 * 1. Static resources (company documentation)
 * 2. Resource templates with parameters (user/project configs)
 * 3. HTTP transport for accessibility
 *
 * Demo resources represent company documentation and user data.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { IncomingMessage, ServerResponse, createServer } from 'node:http';

/**
 * Company handbook - a static markdown resource
 */
const companyHandbook = `# Company Handbook

## Mission Statement
We build tools that empower developers to create better software.

## Core Values
- **Quality**: We ship code we're proud of
- **Collaboration**: We succeed as a team
- **Transparency**: We communicate openly and honestly
- **Growth**: We continuously learn and improve

## Policies

### Remote Work
All team members may work remotely. Core hours are 10am-3pm in your local timezone.

### Code Review
All code changes require at least one approving review before merge.

### On-Call
Engineering teams rotate on-call responsibilities weekly.
`;

/**
 * Coding standards - another static resource
 */
const codingStandards = `# Coding Standards

## General Principles
- Write self-documenting code with clear naming
- Keep functions small and focused (< 20 lines preferred)
- Prefer composition over inheritance

## C# Specific
- Use \`var\` when the type is obvious from the right side
- Prefer \`async/await\` over raw \`Task\` continuations
- Use records for immutable data types
- Enable nullable reference types in all projects

## Testing
- Aim for 80%+ code coverage on business logic
- Use descriptive test names: \`MethodName_Scenario_ExpectedResult\`
- Mock external dependencies, not internal classes
`;

/**
 * API documentation - a static resource with JSON content
 */
const apiEndpoints = JSON.stringify({
  endpoints: [
    {
      path: '/api/users',
      method: 'GET',
      description: 'List all users',
      auth: 'required',
    },
    {
      path: '/api/users/{id}',
      method: 'GET',
      description: 'Get user by ID',
      auth: 'required',
    },
    {
      path: '/api/projects',
      method: 'GET',
      description: 'List all projects',
      auth: 'required',
    },
  ],
}, null, 2);

/**
 * User preferences data by userId
 */
const userPreferences: Record<string, object> = {
  alice: { theme: 'dark', language: 'en', notifications: true, timezone: 'America/New_York' },
  bob: { theme: 'light', language: 'es', notifications: false, timezone: 'Europe/Madrid' },
};

/**
 * Project settings data by projectId
 */
const projectSettings: Record<string, Record<string, unknown>> = {
  frontend: {
    framework: 'React',
    buildTool: 'Vite',
    testRunner: 'Vitest',
    linter: 'ESLint',
    deployTarget: 'Vercel',
  },
  backend: {
    framework: 'ASP.NET Core',
    database: 'PostgreSQL',
    cache: 'Redis',
    testRunner: 'xUnit',
    deployTarget: 'Azure',
  },
  mobile: {
    framework: 'MAUI',
    platforms: ['iOS', 'Android'],
    testRunner: 'NUnit',
    deployTarget: 'App Store / Play Store',
  },
};

/**
 * Get user preferences by userId
 */
function getUserPreferences(userId: string): object {
  const lowerUserId = userId.toLowerCase();
  return userPreferences[lowerUserId] || {
    theme: 'system',
    language: 'en',
    notifications: true,
    timezone: 'UTC',
  };
}

/**
 * Get project settings by projectId
 */
function getProjectSettings(projectId: string): Record<string, unknown> {
  const lowerProjectId = projectId.toLowerCase();
  return projectSettings[lowerProjectId] || {
    framework: 'Unknown',
    note: `No configuration found for project '${projectId}'`,
  };
}

/**
 * Main server class
 */
class ResourceServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer(
      {
        name: 'resource-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
        },
      }
    );

    this.setupResources();
    this.setupErrorHandling();
  }

  /**
   * Set up static resources and resource templates
   */
  private setupResources(): void {
    // Static resources
    this.server.resource(
      'docs://company/handbook',
      'Company Handbook',
      'text/markdown',
      'The company handbook with policies and guidelines',
      async () => ({
        contents: [
          {
            uri: 'docs://company/handbook',
            mimeType: 'text/markdown',
            text: companyHandbook,
          },
        ],
      })
    );

    this.server.resource(
      'docs://company/coding-standards',
      'Coding Standards',
      'text/markdown',
      'The coding standards and best practices guide',
      async () => ({
        contents: [
          {
            uri: 'docs://company/coding-standards',
            mimeType: 'text/markdown',
            text: codingStandards,
          },
        ],
      })
    );

    this.server.resource(
      'docs://api/endpoints',
      'API Endpoints',
      'application/json',
      'Documentation of available API endpoints',
      async () => ({
        contents: [
          {
            uri: 'docs://api/endpoints',
            mimeType: 'application/json',
            text: apiEndpoints,
          },
        ],
      })
    );

    // Resource templates
    this.server.resourceTemplate(
      'config://user/{userId}/preferences',
      'User Preferences',
      'application/json',
      'User-specific preferences and settings',
      async (uri: string) => {
        // Extract userId from URI
        const match = uri.match(/config:\/\/user\/([^/]+)\/preferences/);
        if (!match) {
          throw new Error('Invalid URI format');
        }

        const userId = match[1];
        const preferences = getUserPreferences(userId);

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(preferences, null, 2),
            },
          ],
        };
      }
    );

    this.server.resourceTemplate(
      'config://project/{projectId}/settings',
      'Project Settings',
      'application/json',
      'Project-specific configuration and settings',
      async (uri: string) => {
        // Extract projectId from URI
        const match = uri.match(/config:\/\/project\/([^/]+)\/settings/);
        if (!match) {
          throw new Error('Invalid URI format');
        }

        const projectId = match[1];
        const settings = getProjectSettings(projectId);

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(settings, null, 2),
            },
          ],
        };
      }
    );
  }

  /**
   * Set up error handling and shutdown
   */
  private setupErrorHandling(): void {
    this.server.server.onerror = (error: Error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('\nShutting down server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the HTTP server
   */
  async start(port: number = 5000): Promise<void> {
    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      if (!req.url || !req.url.startsWith('/mcp')) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const transport = new StreamableHTTPServerTransport('/mcp', req, res);
      await this.server.connect(transport);
    });

    httpServer.listen(port, () => {
      console.error(`Resource MCP server is running on http://localhost:${port}/mcp`);
    });
  }
}

// Start the server
const server = new ResourceServer();
server.start(5000).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
