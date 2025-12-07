#!/usr/bin/env python3
"""
FileSystem Resource Client

This sample demonstrates:
1. Listing dynamically-loaded resources from a folder
2. Reading text resources (markdown, json, text)
3. Reading binary resources (images as base64)

Requires: filesystem-server running on port 5002
"""

import asyncio
import base64
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def main():
    """Main entry point for the client."""
    print("=== FileSystem Resource Client ===\n")
    
    # Connect to the FileSystem server
    async with streamablehttp_client(url="http://localhost:5002") as (read_stream, write_stream, _):
        async with ClientSession(
            read_stream=read_stream,
            write_stream=write_stream
        ) as session:
            # Initialize the session
            await session.initialize()
            print("Connected to FileSystem server.\n")
            
            # List all resources
            resources_result = await session.list_resources()
            resources = resources_result.resources
            print(f"Found {len(resources)} resources:\n")
            
            for resource in resources:
                print(f"  URI: {resource.uri}")
                print(f"  Name: {resource.name}")
                print(f"  MIME: {resource.mimeType}")
                print(f"  Description: {resource.description}")
                print()
            
            # Test reading each resource
            print("=" * 60)
            print("Reading each resource:\n")
            
            for resource in resources:
                print(f"--- {resource.name} ({resource.mimeType}) ---")
                
                result = await session.read_resource(uri=resource.uri)
                
                for content in result.contents:
                    if hasattr(content, 'text'):
                        # Text resource
                        print("[TEXT RESOURCE]")
                        # Show first 200 chars or full content if shorter
                        text = content.text
                        preview = text[:200] + "..." if len(text) > 200 else text
                        print(preview)
                    elif hasattr(content, 'blob'):
                        # Binary resource (base64)
                        print("[BINARY RESOURCE (base64)]")
                        blob = content.blob
                        print(f"Base64 length: {len(blob)} chars")
                        preview_len = min(60, len(blob))
                        print(f"Preview: {blob[:preview_len]}...")
                        
                        # Decode and show byte count
                        data = base64.b64decode(blob)
                        print(f"Decoded: {len(data)} bytes")
                        
                        # For PNG, verify magic bytes
                        if resource.mimeType == "image/png" and len(data) >= 8:
                            is_png = (data[0] == 0x89 and data[1] == 0x50 and
                                     data[2] == 0x4E and data[3] == 0x47)
                            print(f"Valid PNG header: {is_png}")
                
                print()
            
            print("=== Test Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
