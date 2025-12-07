#!/usr/bin/env node

/**
 * Model Resource Client (Pattern 3)
 *
 * This sample gives the AI model agency over resource access.
 * The model can decide when to list or read resources using provided tools.
 *
 * Requires:
 * - Resource server running on port 5000
 * - Ollama running locally with qwen3:1.7b model
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Ollama, Tool, Message, ToolCall } from 'ollama';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Main client application
 */
async function main(): Promise<void> {
  console.log('=== Model Resource Client (Pattern 3) ===');
  console.log('This sample gives the AI model agency over resource access.\n');

  // Connect to the MCP resource server
  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:5000/mcp')
  );

  const mcpClient = new Client(
    {
      name: 'model-resource-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await mcpClient.connect(transport);

  // Create tool wrappers for resource operations
  const listResourcesTool: Tool = {
    type: 'function',
    function: {
      name: 'list_resources',
      description: 'Lists all available resources from the MCP server. Returns a JSON array of resources with their names, URIs, descriptions, and MIME types.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  };

  const listResourceTemplatesTool: Tool = {
    type: 'function',
    function: {
      name: 'list_resource_templates',
      description: 'Lists all available resource templates from the MCP server. Templates have URI patterns with placeholders like {userId} that need to be filled in when reading.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  };

  const readResourceTool: Tool = {
    type: 'function',
    function: {
      name: 'read_resource',
      description: 'Reads the content of a specific resource by its URI. For templated resources, provide the full URI with placeholders filled in (e.g., \'config://user/alice/preferences\').',
      parameters: {
        type: 'object',
        properties: {
          uri: {
            type: 'string',
            description: 'The URI of the resource to read',
          },
        },
        required: ['uri'],
      },
    },
  };

  const resourceTools: Tool[] = [listResourcesTool, listResourceTemplatesTool, readResourceTool];

  console.log('Resource tools available to model:');
  for (const tool of resourceTools) {
    console.log(`  - ${tool.function.name}`);
  }
  console.log();

  // Set up the Ollama client
  const model = 'qwen3:1.7b';
  const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

  console.log(`Connecting to Ollama (${model})...\n`);

  // System message to guide the model
  const systemMessage = `You are a helpful assistant with access to a company's resource system.
You can list and read resources to help answer questions.

Available tools:
- list_resources: See what static resources are available
- list_resource_templates: See what templated resources are available
- read_resource: Read the content of a specific resource by URI

When users ask about company policies, coding standards, user preferences,
or project settings, use these tools to find and retrieve the relevant information.

Always check what resources are available before trying to read them.`;

  const messages: Message[] = [
    {
      role: 'system',
      content: systemMessage,
    },
  ];

  console.log('Chat with the AI! Try asking things like:');
  console.log('  - \'What resources are available?\'');
  console.log('  - \'What are the company\'s core values?\'');
  console.log('  - \'Show me the coding standards\'');
  console.log('  - \'What are Alice\'s preferences?\'');
  console.log('  - \'What framework does the backend project use?\'');
  console.log('\nType \'quit\' to exit.\n');

  // Set up readline interface for user input
  const rl = readline.createInterface({ input, output });

  // Main conversation loop
  while (true) {
    try {
      const userPrompt = await rl.question('You: ');

      if (!userPrompt.trim()) {
        continue;
      }

      if (userPrompt.toLowerCase() === 'quit') {
        break;
      }

      messages.push({
        role: 'user',
        content: userPrompt,
      });

      console.log('\nAssistant: ');
      let fullResponse = '';
      let toolCallsList: ToolCall[] | undefined;

      // Call Ollama with tools
      const response = await ollama.chat({
        model,
        messages,
        tools: resourceTools,
        stream: true,
      });

      // Process streaming response
      for await (const chunk of response) {
        if (chunk.message.content) {
          process.stdout.write(chunk.message.content);
          fullResponse += chunk.message.content;
        }

        // Capture tool calls (usually in the last chunk)
        if (chunk.message.tool_calls) {
          toolCallsList = chunk.message.tool_calls;
        }
      }

      console.log(); // New line after response

      // Handle tool calls after streaming is complete
      if (toolCallsList && toolCallsList.length > 0) {
        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: fullResponse,
          tool_calls: toolCallsList,
        });

        for (const toolCall of toolCallsList) {
          const toolName = toolCall.function.name;
          const toolArgs = toolCall.function.arguments as Record<string, unknown>;

          console.log(`\n[Tool Call: ${toolName}]`);

          try {
            let toolResult = '';

            if (toolName === 'list_resources') {
              const resourcesResult = await mcpClient.listResources();
              const result = resourcesResult.resources.map(r => ({
                name: r.name,
                uri: r.uri,
                description: r.description,
                mimeType: r.mimeType,
              }));
              toolResult = JSON.stringify(result, null, 2);
              console.log(`[Returned ${resourcesResult.resources.length} resources]\n`);
            } else if (toolName === 'list_resource_templates') {
              const templatesResult = await mcpClient.listResourceTemplates();
              const result = templatesResult.resourceTemplates.map(t => ({
                name: t.name,
                uriTemplate: t.uriTemplate,
                description: t.description,
                mimeType: t.mimeType,
              }));
              toolResult = JSON.stringify(result, null, 2);
              console.log(`[Returned ${templatesResult.resourceTemplates.length} templates]\n`);
            } else if (toolName === 'read_resource') {
              const uri = toolArgs.uri as string;
              console.log(`[Reading: "${uri}"]`);
              const result = await mcpClient.readResource({ uri });
              const contents: string[] = [];

              for (const content of result.contents) {
                if (content.type === 'text' && 'text' in content) {
                  contents.push(content.text);
                } else if (content.type === 'blob' && 'blob' in content) {
                  contents.push(`[Binary content: ${content.mimeType}, ${content.blob.length} bytes base64]`);
                }
              }

              toolResult = contents.join('\n---\n');
              console.log(`[Returned ${toolResult.length} characters]\n`);
            }

            // Add tool result to messages
            messages.push({
              role: 'tool',
              content: toolResult,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Error: ${errorMessage}]\n`);
            messages.push({
              role: 'tool',
              content: `Error: ${errorMessage}`,
            });
          }
        }

        // Get final response from Ollama after tool calls
        console.log('Assistant: ');
        const finalResponse = await ollama.chat({
          model,
          messages,
          tools: resourceTools,
          stream: true,
        });

        let fullFinal = '';
        for await (const finalChunk of finalResponse) {
          if (finalChunk.message.content) {
            process.stdout.write(finalChunk.message.content);
            fullFinal += finalChunk.message.content;
          }
        }

        // Add final assistant message
        messages.push({
          role: 'assistant',
          content: fullFinal,
        });
        console.log();
      } else {
        // No tool calls, just add the assistant response
        messages.push({
          role: 'assistant',
          content: fullResponse,
        });
      }

      console.log(); // Extra line for spacing
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMessage}`);
      console.log();
    }
  }

  rl.close();
  await mcpClient.close();
  console.log('Goodbye!');
  process.exit(0);
}

// Start the client
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
