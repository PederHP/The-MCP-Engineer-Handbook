#!/usr/bin/env python3
"""
Model Resource Client (Pattern 3)

This sample gives the AI model agency over resource access.
The model can decide when to list and read resources through tool calls.

Key points:
- Resources are accessed via tools, not pre-injection
- Model has agency to decide what resources to access
- More dynamic and flexible than injection patterns
- Model can explore and discover resources
- Tool results naturally appear in conversation
"""

import asyncio
import json
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client
import ollama


async def main():
    """Main entry point for the demo."""
    print("=== Model Resource Client (Pattern 3) ===")
    print("This sample gives the AI model agency over resource access.\n")
    
    # Connect to the MCP resource server
    async with streamablehttp_client(url="http://localhost:5000") as (read_stream, write_stream, _):
        async with ClientSession(
            read_stream=read_stream,
            write_stream=write_stream
        ) as session:
            # Initialize the session
            await session.initialize()
            
            # Create tool functions for the model to use
            async def list_resources_tool():
                """Lists all available resources from the MCP server."""
                print("\n[Tool Call: list_resources]")
                resources_result = await session.list_resources()
                resources = resources_result.resources
                
                result = [
                    {
                        "name": r.name,
                        "uri": r.uri,
                        "description": r.description,
                        "mimeType": r.mimeType
                    }
                    for r in resources
                ]
                
                json_result = json.dumps(result, indent=2)
                print(f"[Returned {len(resources)} resources]\n")
                return json_result
            
            async def list_resource_templates_tool():
                """Lists all available resource templates from the MCP server."""
                print("\n[Tool Call: list_resource_templates]")
                templates_result = await session.list_resource_templates()
                templates = templates_result.resourceTemplates
                
                result = [
                    {
                        "name": t.name,
                        "uriTemplate": t.uriTemplate,
                        "description": t.description,
                        "mimeType": t.mimeType
                    }
                    for t in templates
                ]
                
                json_result = json.dumps(result, indent=2)
                print(f"[Returned {len(templates)} templates]\n")
                return json_result
            
            async def read_resource_tool(uri: str):
                """Reads the content of a specific resource by its URI."""
                print(f"\n[Tool Call: read_resource(\"{uri}\")]")
                try:
                    result = await session.read_resource(uri=uri)
                    contents = []
                    
                    for content in result.contents:
                        if hasattr(content, 'text'):
                            contents.append(content.text)
                        elif hasattr(content, 'blob'):
                            contents.append(f"[Binary content: {content.mimeType}, {len(content.blob)} bytes base64]")
                    
                    text = "\n---\n".join(contents)
                    print(f"[Returned {len(text)} characters]\n")
                    return text
                except Exception as e:
                    print(f"[Error: {e}]\n")
                    return f"Error reading resource: {e}"
            
            # Convert to Ollama tool format
            ollama_tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "list_resources",
                        "description": "Lists all available resources from the MCP server. Returns a JSON array of resources with their names, URIs, descriptions, and MIME types.",
                        "parameters": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "list_resource_templates",
                        "description": "Lists all available resource templates from the MCP server. Templates have URI patterns with placeholders like {userId} that need to be filled in when reading.",
                        "parameters": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "read_resource",
                        "description": "Reads the content of a specific resource by its URI. For templated resources, provide the full URI with placeholders filled in (e.g., 'config://user/alice/preferences').",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "uri": {
                                    "type": "string",
                                    "description": "The URI of the resource to read"
                                }
                            },
                            "required": ["uri"]
                        }
                    }
                }
            ]
            
            print("Resource tools available to model:")
            for tool in ollama_tools:
                print(f"  - {tool['function']['name']}")
            print()
            
            # Set up the Ollama client
            client = ollama.AsyncClient(host="http://127.0.0.1:11434")
            model = "qwen2.5:1.5b"
            
            print(f"Connecting to Ollama ({model})...\n")
            
            # System message to guide the model
            system_message = """You are a helpful assistant with access to a company's resource system.
You can list and read resources to help answer questions.

Available tools:
- list_resources: See what static resources are available
- list_resource_templates: See what templated resources are available
- read_resource: Read the content of a specific resource by URI

When users ask about company policies, coding standards, user preferences,
or project settings, use these tools to find and retrieve the relevant information.

Always check what resources are available before trying to read them.
"""
            
            messages = [
                {
                    "role": "system",
                    "content": system_message
                }
            ]
            
            print("Chat with the AI! Try asking things like:")
            print("  - 'What resources are available?'")
            print("  - 'What are the company's core values?'")
            print("  - 'Show me the coding standards'")
            print("  - 'What are Alice's preferences?'")
            print("  - 'What framework does the backend project use?'")
            print("\nType 'quit' to exit.\n")
            
            while True:
                print("You: ", end="")
                user_prompt = input()
                
                if not user_prompt.strip():
                    continue
                
                if user_prompt.lower() == "quit":
                    break
                
                # Add user message
                messages.append({
                    "role": "user",
                    "content": user_prompt
                })
                
                # Call Ollama with tools
                response = await client.chat(
                    model=model,
                    messages=messages,
                    tools=ollama_tools,
                    stream=False  # Non-streaming for tool calls
                )
                
                # Check for tool calls
                if response.message.tool_calls:
                    # Add assistant message with tool calls
                    messages.append({
                        "role": "assistant",
                        "content": response.message.content or "",
                        "tool_calls": response.message.tool_calls
                    })
                    
                    # Execute tool calls
                    for tool_call in response.message.tool_calls:
                        tool_name = tool_call.function.name
                        tool_args = tool_call.function.arguments
                        
                        # Call the appropriate function
                        if tool_name == "list_resources":
                            tool_result = await list_resources_tool()
                        elif tool_name == "list_resource_templates":
                            tool_result = await list_resource_templates_tool()
                        elif tool_name == "read_resource":
                            uri = tool_args.get("uri", "")
                            tool_result = await read_resource_tool(uri)
                        else:
                            tool_result = f"Unknown tool: {tool_name}"
                        
                        # Add tool result to messages
                        messages.append({
                            "role": "tool",
                            "content": tool_result
                        })
                    
                    # Get final response after tool calls
                    final_response = await client.chat(
                        model=model,
                        messages=messages,
                        tools=ollama_tools,
                        stream=True
                    )
                    
                    print("\nAssistant: ", end="")
                    full_content = ""
                    async for chunk in final_response:
                        if chunk.message.content:
                            print(chunk.message.content, end="", flush=True)
                            full_content += chunk.message.content
                    
                    # Add final assistant message
                    messages.append({
                        "role": "assistant",
                        "content": full_content
                    })
                    print("\n")
                else:
                    # No tool calls, just display response
                    print(f"\nAssistant: {response.message.content}\n")
                    messages.append({
                        "role": "assistant",
                        "content": response.message.content
                    })
            
            print("Goodbye!")


if __name__ == "__main__":
    asyncio.run(main())
