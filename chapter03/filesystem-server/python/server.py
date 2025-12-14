#!/usr/bin/env python3
"""
FileSystem Resource Server - HTTP Transport

This sample demonstrates:
1. Dynamic resource loading from a folder (not attribute-based)
2. Binary resource support (images, etc.)
3. MIME type detection from file extensions
4. Serving both text and binary files as resources

Run with: python server.py [path-to-folder]
Default: ./sample-resources
"""

import asyncio
import base64
import os
import sys
from pathlib import Path
from typing import Optional
from mcp.server import Server
from mcp.server.streamable_http import create_streamable_http_server_and_sse_handler
from mcp.types import (
    Resource,
    TextContent,
    BlobContent,
    ReadResourceResult,
    ListResourcesResult
)


# Create the server instance
app = Server("filesystem-server")


# Global variable to store the resource folder path
RESOURCE_FOLDER: Optional[Path] = None


def get_mime_type(file_path: str) -> str:
    """
    Determine MIME type from file extension.
    
    Args:
        file_path: Path to the file
    
    Returns:
        MIME type string
    """
    ext = Path(file_path).suffix.lower()
    
    mime_types = {
        # Text types
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".html": "text/html",
        ".htm": "text/html",
        ".css": "text/css",
        ".csv": "text/csv",
        ".xml": "text/xml",
        
        # Application types
        ".json": "application/json",
        ".js": "application/javascript",
        ".pdf": "application/pdf",
        ".zip": "application/zip",
        
        # Image types
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        
        # Code types (treat as text)
        ".cs": "text/x-csharp",
        ".py": "text/x-python",
        ".ts": "text/typescript",
        ".rs": "text/x-rust",
        ".go": "text/x-go",
        ".java": "text/x-java",
        ".cpp": "text/x-c++",
        ".cc": "text/x-c++",
        ".cxx": "text/x-c++",
        ".c": "text/x-c",
        ".h": "text/x-c",
        ".sh": "text/x-shellscript",
        ".yaml": "text/yaml",
        ".yml": "text/yaml",
    }
    
    return mime_types.get(ext, "application/octet-stream")


def is_text_mime_type(mime_type: str) -> bool:
    """
    Check if a MIME type represents text content.
    
    Args:
        mime_type: The MIME type to check
    
    Returns:
        True if the MIME type is text-based
    """
    return (
        mime_type.startswith("text/")
        or mime_type == "application/json"
        or mime_type == "application/javascript"
        or mime_type == "image/svg+xml"  # SVG is XML-based text
    )


def format_file_size(size: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size: Size in bytes
    
    Returns:
        Formatted size string
    """
    suffixes = ["B", "KB", "MB", "GB"]
    counter = 0
    size_float = float(size)
    
    while size_float >= 1024 and counter < len(suffixes) - 1:
        size_float /= 1024
        counter += 1
    
    return f"{size_float:.1f} {suffixes[counter]}"


def create_sample_files(folder: Path):
    """
    Create sample files in the resource folder.
    
    Args:
        folder: Path to the resource folder
    """
    # Create sample markdown file
    (folder / "readme.md").write_text("""# Sample Resources

This folder contains sample resources for the FileSystem Resource Server demo.

## Contents
- readme.md (this file)
- config.json (sample configuration)
- notes.txt (plain text notes)
- logo.png (sample image - demonstrates binary resources)
""")
    
    # Create sample JSON
    (folder / "config.json").write_text("""{
  "appName": "FileSystem Resource Server Demo",
  "version": "1.0.0",
  "settings": {
    "maxFileSize": "10MB",
    "allowedExtensions": [".txt", ".md", ".json", ".png", ".jpg"],
    "cacheEnabled": true
  }
}
""")
    
    # Create sample text file
    (folder / "notes.txt").write_text("""Development Notes
==================

This server demonstrates dynamic resource loading from a filesystem.

Key features:
- Files are discovered dynamically (no hardcoded list)
- Binary files (images) are served as base64-encoded blobs
- Text files are served as plain text
- MIME types are inferred from file extensions

Try adding more files to this folder and they'll appear automatically!
""")
    
    # Create a minimal PNG image (1x1 red pixel)
    minimal_png = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D,  # IHDR chunk length
        0x49, 0x48, 0x44, 0x52,  # "IHDR"
        0x00, 0x00, 0x00, 0x01,  # width: 1
        0x00, 0x00, 0x00, 0x01,  # height: 1
        0x08, 0x02,              # bit depth: 8, color type: 2 (RGB)
        0x00, 0x00, 0x00,        # compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE,  # IHDR CRC
        0x00, 0x00, 0x00, 0x0C,  # IDAT chunk length
        0x49, 0x44, 0x41, 0x54,  # "IDAT"
        0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00,  # compressed data
        0x01, 0x01, 0x01, 0x00,  # Adler-32 checksum
        0x1B, 0xB6, 0xEE, 0x56,  # IDAT CRC
        0x00, 0x00, 0x00, 0x00,  # IEND chunk length
        0x49, 0x45, 0x4E, 0x44,  # "IEND"
        0xAE, 0x42, 0x60, 0x82   # IEND CRC
    ])
    (folder / "logo.png").write_bytes(minimal_png)
    
    print("Created sample files in resource folder", file=sys.stderr)


@app.list_resources()
async def list_resources() -> list[Resource]:
    """
    Dynamically list all files in the resource folder.
    
    Returns:
        List of Resource objects for each file in the folder.
    """
    resources = []
    
    if RESOURCE_FOLDER is None:
        return resources
    
    # Walk through all files in the folder
    for file_path in RESOURCE_FOLDER.rglob("*"):
        if file_path.is_file():
            relative_path = file_path.relative_to(RESOURCE_FOLDER)
            # Convert path separators to forward slashes for URI
            uri_path = str(relative_path).replace(os.sep, "/")
            uri = f"file://resources/{uri_path}"
            mime_type = get_mime_type(str(file_path))
            file_size = file_path.stat().st_size
            
            resources.append(Resource(
                uri=uri,
                name=file_path.name,
                mimeType=mime_type,
                description=f"File: {relative_path} ({format_file_size(file_size)})"
            ))
    
    print(f"Listed {len(resources)} resources", file=sys.stderr)
    return resources


@app.read_resource()
async def read_resource(uri: str) -> ReadResourceResult:
    """
    Read the content of a specific file resource.
    
    Args:
        uri: The URI of the resource to read (format: file://resources/path/to/file)
    
    Returns:
        ReadResourceResult with the file content (text or binary)
    
    Raises:
        ValueError: If the URI is invalid or file not found
    """
    if not uri:
        raise ValueError("Missing URI parameter")
    
    # Parse the URI to get the file path
    prefix = "file://resources/"
    if not uri.startswith(prefix):
        raise ValueError(f"Invalid URI format: {uri}")
    
    relative_path = uri[len(prefix):]
    file_path = RESOURCE_FOLDER / relative_path.replace("/", os.sep)
    
    # Security: Ensure we're not escaping the resource folder
    try:
        file_path = file_path.resolve()
        resource_folder_resolved = RESOURCE_FOLDER.resolve()
        if not str(file_path).startswith(str(resource_folder_resolved)):
            raise ValueError("Access denied: path traversal attempt")
    except Exception as e:
        raise ValueError(f"Invalid path: {e}")
    
    if not file_path.exists():
        raise ValueError(f"Resource not found: {uri}")
    
    mime_type = get_mime_type(str(file_path))
    print(f"Reading resource: {relative_path} ({mime_type})", file=sys.stderr)
    
    # Determine if this is a text or binary file
    if is_text_mime_type(mime_type):
        # Text resource
        text = file_path.read_text(encoding="utf-8")
        return ReadResourceResult(
            contents=[
                TextContent(
                    type="text",
                    text=text
                )
            ]
        )
    else:
        # Binary resource (images, etc.)
        data = file_path.read_bytes()
        blob = base64.b64encode(data).decode("ascii")
        
        return ReadResourceResult(
            contents=[
                BlobContent(
                    type="blob",
                    blob=blob,
                    mimeType=mime_type
                )
            ]
        )


async def main():
    """Main entry point for the server."""
    global RESOURCE_FOLDER
    
    # Get the resource folder from args
    if len(sys.argv) > 1:
        resource_folder = Path(sys.argv[1])
    else:
        resource_folder = Path.cwd() / "sample-resources"
    
    RESOURCE_FOLDER = resource_folder
    
    if not resource_folder.exists():
        print(f"Creating sample resources folder: {resource_folder}", file=sys.stderr)
        resource_folder.mkdir(parents=True)
        create_sample_files(resource_folder)
    
    print(f"Serving resources from: {resource_folder}", file=sys.stderr)
    
    from starlette.applications import Starlette
    from starlette.routing import Route
    import uvicorn
    
    # Create SSE handler
    sse_handler = create_streamable_http_server_and_sse_handler(app)
    
    # Create Starlette app with SSE endpoint
    web_app = Starlette(
        routes=[
            Route("/sse", endpoint=sse_handler, methods=["GET"]),
            Route("/messages", endpoint=sse_handler, methods=["POST"]),
        ]
    )
    
    print("FileSystem Resource Server started on http://localhost:5002", file=sys.stderr)
    
    # Run the server on port 5002 (different from resource-server)
    config = uvicorn.Config(web_app, host="0.0.0.0", port=5002, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())
