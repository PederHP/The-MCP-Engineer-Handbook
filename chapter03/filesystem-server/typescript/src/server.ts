#!/usr/bin/env node

/**
 * FileSystem Resource Server
 *
 * This server demonstrates:
 * 1. Dynamic resource loading from a folder (not attribute-based)
 * 2. Binary resource support (images, etc.)
 * 3. Using handlers instead of attributed methods
 * 4. MIME type detection from file extensions
 *
 * Run with: node dist/server.js [path-to-folder]
 * Default: ./sample-resources
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { IncomingMessage, ServerResponse, createServer } from 'node:http';
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, sep, resolve, dirname } from 'node:path';

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Text types
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.xml': 'text/xml',

    // Application types
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',

    // Image types
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',

    // Code types (treat as text)
    '.cs': 'text/x-csharp',
    '.py': 'text/x-python',
    '.ts': 'text/typescript',
    '.rs': 'text/x-rust',
    '.go': 'text/x-go',
    '.java': 'text/x-java',
    '.cpp': 'text/x-c++',
    '.cc': 'text/x-c++',
    '.cxx': 'text/x-c++',
    '.c': 'text/x-c',
    '.h': 'text/x-c',
    '.sh': 'text/x-shellscript',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Check if MIME type is text-based
 */
function isTextMimeType(mimeType: string): boolean {
  return mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'image/svg+xml'; // SVG is XML-based text
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  const suffixes = ['B', 'KB', 'MB', 'GB'];
  let counter = 0;
  let number = bytes;
  
  while (Math.round(number / 1024) >= 1 && counter < suffixes.length - 1) {
    number /= 1024;
    counter++;
  }
  
  return `${number.toFixed(1)} ${suffixes[counter]}`;
}

/**
 * Recursively list all files in a directory
 */
async function listFilesRecursive(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await listFilesRecursive(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Create sample files in the resource folder
 */
async function createSampleFiles(folder: string): Promise<void> {
  // Create sample text file
  await writeFile(join(folder, 'readme.md'), `# Sample Resources

This folder contains sample resources for the FileSystem Resource Server demo.

## Contents
- readme.md (this file)
- config.json (sample configuration)
- notes.txt (plain text notes)
- logo.png (sample image - demonstrates binary resources)
`);

  // Create sample JSON
  await writeFile(join(folder, 'config.json'), JSON.stringify({
    appName: 'FileSystem Resource Server Demo',
    version: '1.0.0',
    settings: {
      maxFileSize: '10MB',
      allowedExtensions: ['.txt', '.md', '.json', '.png', '.jpg'],
      cacheEnabled: true,
    },
  }, null, 2));

  // Create sample text file
  await writeFile(join(folder, 'notes.txt'), `Development Notes
==================

This server demonstrates dynamic resource loading from a filesystem.

Key features:
- Files are discovered dynamically (no hardcoded list)
- Binary files (images) are served as base64-encoded blobs
- Text files are served as plain text
- MIME types are inferred from file extensions

Try adding more files to this folder and they'll appear automatically!
`);

  // Create a minimal PNG image (1x1 red pixel)
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02,             // bit depth: 8, color type: 2 (RGB)
    0x00, 0x00, 0x00,       // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // IHDR CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // "IDAT"
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, // compressed data (red pixel)
    0x01, 0x01, 0x01, 0x00, // Adler-32 checksum
    0x1B, 0xB6, 0xEE, 0x56, // IDAT CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // "IEND"
    0xAE, 0x42, 0x60, 0x82, // IEND CRC
  ]);
  
  await writeFile(join(folder, 'logo.png'), minimalPng);

  console.error('Created sample files in resource folder');
}

/**
 * Main server class
 */
class FileSystemServer {
  private server: McpServer;
  private resourceFolder: string;

  constructor(resourceFolder: string) {
    this.resourceFolder = resourceFolder;
    
    this.server = new McpServer(
      {
        name: 'filesystem-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Set up resource handlers
   */
  private setupHandlers(): void {
    // List resources handler
    this.server.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const files = await listFilesRecursive(this.resourceFolder);
      const resources = [];

      for (const filePath of files) {
        const relativePath = relative(this.resourceFolder, filePath);
        const uri = `file://resources/${relativePath.split(sep).join('/')}`;
        const mimeType = getMimeType(filePath);
        const fileInfo = await stat(filePath);

        resources.push({
          uri,
          name: relativePath.split(sep).pop() || relativePath,
          description: `File: ${relativePath} (${formatFileSize(fileInfo.size)})`,
          mimeType,
        });
      }

      console.error(`Listed ${resources.length} resources`);

      return { resources };
    });

    // Read resource handler
    this.server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params?.uri;
      if (!uri) {
        throw new Error('Missing URI parameter');
      }

      // Parse the URI to get the file path
      const prefix = 'file://resources/';
      if (!uri.startsWith(prefix)) {
        throw new Error(`Invalid URI format: ${uri}`);
      }

      const relativePath = uri.substring(prefix.length);
      const filePath = join(this.resourceFolder, relativePath.split('/').join(sep));

      // Security: Ensure we're not escaping the resource folder
      const fullPath = resolve(filePath);
      const fullResourceFolder = resolve(this.resourceFolder);
      if (!fullPath.startsWith(fullResourceFolder)) {
        throw new Error('Access denied: path traversal attempt');
      }

      if (!existsSync(fullPath)) {
        throw new Error(`Resource not found: ${uri}`);
      }

      const mimeType = getMimeType(fullPath);
      console.error(`Reading resource: ${relativePath} (${mimeType})`);

      // Determine if this is a text or binary file
      if (isTextMimeType(mimeType)) {
        // Text resource
        const text = await readFile(fullPath, 'utf-8');
        return {
          contents: [
            {
              uri,
              mimeType,
              text,
            },
          ],
        };
      } else {
        // Binary resource (images, etc.)
        const bytes = await readFile(fullPath);
        const base64 = bytes.toString('base64');

        return {
          contents: [
            {
              uri,
              mimeType,
              blob: base64,
            },
          ],
        };
      }
    });
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
  async start(port: number = 5002): Promise<void> {
    const transports: Record<string, StreamableHTTPServerTransport> = {};

    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      if (!req.url || !req.url.startsWith('/mcp')) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      try {
        // Simple implementation for single-session HTTP transport
        const sessionId = 'default';
        
        if (!transports[sessionId]) {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => sessionId,
          });
          transports[sessionId] = transport;
          await this.server.connect(transport);
        }

        await transports[sessionId].handleRequest(req, res);
      } catch (error) {
        console.error('Error handling request:', error);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      }
    });

    httpServer.listen(port, () => {
      console.error(`FileSystem Resource Server started on http://localhost:${port}/mcp`);
      console.error(`Serving resources from: ${this.resourceFolder}`);
    });
  }
}

// Main entry point
async function main(): Promise<void> {
  // Get the resource folder from args
  const args = process.argv.slice(2);
  const folderArg = args.find(a => !a.startsWith('--'));
  const resourceFolder = folderArg || join(process.cwd(), 'sample-resources');

  if (!existsSync(resourceFolder)) {
    console.error(`Creating sample resources folder: ${resourceFolder}`);
    await mkdir(resourceFolder, { recursive: true });
    await createSampleFiles(resourceFolder);
  }

  const server = new FileSystemServer(resourceFolder);
  await server.start(5002);
}

// Start the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
