#!/usr/bin/env node

/**
 * FileSystem Resource Client
 *
 * This client demonstrates:
 * 1. Listing dynamically-loaded resources from a folder
 * 2. Reading text resources (markdown, json, text)
 * 3. Reading binary resources (images as base64)
 *
 * Requires: filesystem-server running on port 5002
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Main client application
 */
async function main(): Promise<void> {
  console.log('=== FileSystem Resource Client ===\n');

  // Connect to the FileSystem server
  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:5002/mcp')
  );

  const mcpClient = new Client(
    {
      name: 'filesystem-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await mcpClient.connect(transport);
    console.log('Connected to FileSystem server.\n');

    // List all resources
    const resourcesResult = await mcpClient.listResources();
    const resources = resourcesResult.resources;
    
    console.log(`Found ${resources.length} resources:\n`);

    for (const resource of resources) {
      console.log(`  URI: ${resource.uri}`);
      console.log(`  Name: ${resource.name}`);
      console.log(`  MIME: ${resource.mimeType}`);
      console.log(`  Description: ${resource.description}`);
      console.log();
    }

    // Test reading each resource
    console.log('='.repeat(60));
    console.log('Reading each resource:\n');

    for (const resource of resources) {
      console.log(`--- ${resource.name} (${resource.mimeType}) ---`);

      const result = await mcpClient.readResource({ uri: resource.uri });

      for (const content of result.contents) {
        if (content.type === 'text' && 'text' in content) {
          console.log('[TEXT RESOURCE]');
          // Show first 200 chars or full content if shorter
          const preview = content.text.length > 200
            ? content.text.substring(0, 200) + '...'
            : content.text;
          console.log(preview);
        } else if (content.type === 'blob' && 'blob' in content) {
          console.log('[BINARY RESOURCE (base64)]');
          const blob = content.blob;
          console.log(`Base64 length: ${blob.length} chars`);
          console.log(`Preview: ${blob.substring(0, Math.min(60, blob.length))}...`);

          // Decode and show byte count
          const bytes = Buffer.from(blob, 'base64');
          console.log(`Decoded: ${bytes.length} bytes`);

          // For PNG, verify magic bytes
          if (resource.mimeType === 'image/png' && bytes.length >= 8) {
            const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 &&
                          bytes[2] === 0x4E && bytes[3] === 0x47;
            console.log(`Valid PNG header: ${isPng}`);
          }
        }
      }
      console.log();
    }

    console.log('=== Test Complete ===');

    await mcpClient.close();
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
}

// Start the client
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
