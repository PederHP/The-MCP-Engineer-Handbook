#!/usr/bin/env node

/**
 * MCP Resource Client Demo
 *
 * This client demonstrates:
 * 1. Listing available resources
 * 2. Listing resource templates
 * 3. Reading static resources
 * 4. Reading templated resources with parameters
 *
 * Requires: resource-server running on port 5000
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Main client application
 */
async function main(): Promise<void> {
  // Connect to the resource server
  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:5000/mcp')
  );

  const mcpClient = new Client(
    {
      name: 'resource-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await mcpClient.connect(transport);
    console.log('=== MCP Resource Client Demo ===\n');

    // 1. List all direct resources
    console.log('📚 Available Resources:');
    console.log('-'.repeat(50));

    const resourcesResult = await mcpClient.listResources();
    const resources = resourcesResult.resources;

    for (const resource of resources) {
      console.log(`  Name: ${resource.name}`);
      console.log(`  URI:  ${resource.uri}`);
      console.log(`  Type: ${resource.mimeType || 'text/plain'}`);
      if (resource.description) {
        console.log(`  Desc: ${resource.description}`);
      }
      console.log();
    }

    // 2. List all resource templates
    console.log('📋 Available Resource Templates:');
    console.log('-'.repeat(50));

    const templatesResult = await mcpClient.listResourceTemplates();
    const templates = templatesResult.resourceTemplates;

    for (const template of templates) {
      console.log(`  Name: ${template.name}`);
      console.log(`  URI:  ${template.uriTemplate}`);
      console.log(`  Type: ${template.mimeType || 'text/plain'}`);
      if (template.description) {
        console.log(`  Desc: ${template.description}`);
      }
      console.log();
    }

    // 3. Read a specific resource
    console.log('📖 Reading \'Company Handbook\' resource:');
    console.log('-'.repeat(50));

    const handbookResult = await mcpClient.readResource({
      uri: 'docs://company/handbook',
    });

    for (const content of handbookResult.contents) {
      if (content.type === 'text' && 'text' in content) {
        // Show first 500 chars to keep output manageable
        const preview = content.text.length > 500
          ? content.text.substring(0, 500) + '\n[... truncated ...]'
          : content.text;
        console.log(preview);
      }
    }
    console.log();

    // 4. Read a resource template with parameters
    console.log('👤 Reading User Preferences for \'alice\':');
    console.log('-'.repeat(50));

    const alicePrefs = await mcpClient.readResource({
      uri: 'config://user/alice/preferences',
    });

    for (const content of alicePrefs.contents) {
      if (content.type === 'text' && 'text' in content) {
        console.log(content.text);
      }
    }
    console.log();

    // 5. Read another templated resource
    console.log('🏗️ Reading Project Settings for \'backend\':');
    console.log('-'.repeat(50));

    const backendSettings = await mcpClient.readResource({
      uri: 'config://project/backend/settings',
    });

    for (const content of backendSettings.contents) {
      if (content.type === 'text' && 'text' in content) {
        console.log(content.text);
      }
    }
    console.log();

    console.log('✅ Resource client demo complete!');

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
