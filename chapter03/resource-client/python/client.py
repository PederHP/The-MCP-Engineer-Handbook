#!/usr/bin/env python3
"""
MCP Resource Client - HTTP Transport

This sample demonstrates:
1. Listing direct resources (static URIs)
2. Listing resource templates (parameterized URIs)
3. Reading specific resources
4. Reading templated resources with parameters

Requires: resource-server running on port 5000
"""

import asyncio
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def main():
    """Main entry point for the client."""
    # Connect to the resource server
    async with streamablehttp_client(url="http://localhost:5000") as (read_stream, write_stream, _):
        async with ClientSession(
            read_stream=read_stream,
            write_stream=write_stream
        ) as session:
            # Initialize the session
            await session.initialize()
            
            print("=== MCP Resource Client Demo ===\n")
            
            # 1. List all direct resources
            print("📚 Available Resources:")
            print("-" * 50)
            
            resources_result = await session.list_resources()
            resources = resources_result.resources
            
            for resource in resources:
                print(f"  Name: {resource.name}")
                print(f"  URI:  {resource.uri}")
                print(f"  Type: {resource.mimeType or 'text/plain'}")
                if resource.description:
                    print(f"  Desc: {resource.description}")
                print()
            
            # 2. List all resource templates
            print("📋 Available Resource Templates:")
            print("-" * 50)
            
            templates_result = await session.list_resource_templates()
            templates = templates_result.resourceTemplates
            
            for template in templates:
                print(f"  Name: {template.name}")
                print(f"  URI:  {template.uriTemplate}")
                print(f"  Type: {template.mimeType or 'text/plain'}")
                if template.description:
                    print(f"  Desc: {template.description}")
                print()
            
            # 3. Read a specific resource
            print("📖 Reading 'Company Handbook' resource:")
            print("-" * 50)
            
            handbook_result = await session.read_resource(uri="docs://company/handbook")
            for content in handbook_result.contents:
                if hasattr(content, 'text'):
                    # Show first 500 chars to keep output manageable
                    text = content.text
                    preview = text[:500] + "\n[... truncated ...]" if len(text) > 500 else text
                    print(preview)
            print()
            
            # 4. Read a resource template with parameters
            print("👤 Reading User Preferences for 'alice':")
            print("-" * 50)
            
            # For templated resources, we construct the full URI with parameters
            alice_uri = "config://user/alice/preferences"
            alice_prefs = await session.read_resource(uri=alice_uri)
            
            for content in alice_prefs.contents:
                if hasattr(content, 'text'):
                    print(content.text)
            print()
            
            # 5. Read another templated resource
            print("🏗️ Reading Project Settings for 'backend':")
            print("-" * 50)
            
            backend_uri = "config://project/backend/settings"
            backend_settings = await session.read_resource(uri=backend_uri)
            
            for content in backend_settings.contents:
                if hasattr(content, 'text'):
                    print(content.text)
            print()
            
            print("✅ Resource client demo complete!")


if __name__ == "__main__":
    asyncio.run(main())
