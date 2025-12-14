#!/usr/bin/env python3
"""
MCP Resource Server - HTTP Transport

This sample demonstrates:
- Static resources (documents with fixed URIs)
- Resource templates (parameterized URIs like config://user/{userId}/preferences)
- Different content types (markdown, JSON)
- Resources with descriptive metadata

Resources represent company documentation and user data.
"""

import asyncio
import json
from typing import Any
from mcp.server import Server
from mcp.server.streamable_http import create_streamable_http_server_and_sse_handler
from mcp.types import (
    Resource,
    ResourceTemplate,
    TextContent,
    ReadResourceResult,
    ListResourcesResult,
    ListResourceTemplatesResult
)


# Create the server instance
app = Server("resource-server")


@app.list_resources()
async def list_resources() -> list[Resource]:
    """
    List all static resources (non-templated).
    
    Returns:
        List of Resource objects with fixed URIs.
    """
    return [
        Resource(
            uri="docs://company/handbook",
            name="Company Handbook",
            mimeType="text/markdown",
            description="The company handbook with policies and guidelines"
        ),
        Resource(
            uri="docs://company/coding-standards",
            name="Coding Standards",
            mimeType="text/markdown",
            description="The coding standards and best practices guide"
        ),
        Resource(
            uri="docs://api/endpoints",
            name="API Endpoints",
            mimeType="application/json",
            description="Documentation of available API endpoints"
        )
    ]


@app.list_resource_templates()
async def list_resource_templates() -> list[ResourceTemplate]:
    """
    List all resource templates (parameterized URIs).
    
    Returns:
        List of ResourceTemplate objects with URI patterns.
    """
    return [
        ResourceTemplate(
            uriTemplate="config://user/{userId}/preferences",
            name="User Preferences",
            mimeType="application/json",
            description="User-specific preferences and settings"
        ),
        ResourceTemplate(
            uriTemplate="config://project/{projectId}/settings",
            name="Project Settings",
            mimeType="application/json",
            description="Project-specific configuration and settings"
        )
    ]


@app.read_resource()
async def read_resource(uri: str) -> ReadResourceResult:
    """
    Read the content of a specific resource or resource template.
    
    Args:
        uri: The URI of the resource to read. Can be a static URI or 
             a templated URI with parameters filled in.
    
    Returns:
        ReadResourceResult with the resource content.
    
    Raises:
        ValueError: If the resource URI is not found.
    """
    # Static resources
    if uri == "docs://company/handbook":
        return ReadResourceResult(
            contents=[
                TextContent(
                    type="text",
                    text="""# Company Handbook

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
"""
                )
            ]
        )
    
    elif uri == "docs://company/coding-standards":
        return ReadResourceResult(
            contents=[
                TextContent(
                    type="text",
                    text="""# Coding Standards

## General Principles
- Write self-documenting code with clear naming
- Keep functions small and focused (< 20 lines preferred)
- Prefer composition over inheritance

## C# Specific
- Use `var` when the type is obvious from the right side
- Prefer `async/await` over raw `Task` continuations
- Use records for immutable data types
- Enable nullable reference types in all projects

## Testing
- Aim for 80%+ code coverage on business logic
- Use descriptive test names: `MethodName_Scenario_ExpectedResult`
- Mock external dependencies, not internal classes
"""
                )
            ]
        )
    
    elif uri == "docs://api/endpoints":
        api_docs = {
            "endpoints": [
                {
                    "path": "/api/users",
                    "method": "GET",
                    "description": "List all users",
                    "auth": "required"
                },
                {
                    "path": "/api/users/{id}",
                    "method": "GET",
                    "description": "Get user by ID",
                    "auth": "required"
                },
                {
                    "path": "/api/projects",
                    "method": "GET",
                    "description": "List all projects",
                    "auth": "required"
                }
            ]
        }
        return ReadResourceResult(
            contents=[
                TextContent(
                    type="text",
                    text=json.dumps(api_docs, indent=2)
                )
            ]
        )
    
    # Resource templates - parse the URI to extract parameters
    elif uri.startswith("config://user/") and uri.endswith("/preferences"):
        # Extract userId from URI: config://user/{userId}/preferences
        parts = uri.split("/")
        if len(parts) >= 4:
            user_id = parts[3]
            preferences = get_user_preferences(user_id)
            return ReadResourceResult(
                contents=[
                    TextContent(
                        type="text",
                        text=json.dumps(preferences, indent=2)
                    )
                ]
            )
    
    elif uri.startswith("config://project/") and uri.endswith("/settings"):
        # Extract projectId from URI: config://project/{projectId}/settings
        parts = uri.split("/")
        if len(parts) >= 4:
            project_id = parts[3]
            settings = get_project_settings(project_id)
            return ReadResourceResult(
                contents=[
                    TextContent(
                        type="text",
                        text=json.dumps(settings, indent=2)
                    )
                ]
            )
    
    raise ValueError(f"Resource not found: {uri}")


def get_user_preferences(user_id: str) -> dict[str, Any]:
    """
    Get user preferences by user ID.
    In a real application, this would fetch from a database.
    
    Args:
        user_id: The user identifier
    
    Returns:
        Dictionary of user preferences
    """
    user_id_lower = user_id.lower()
    
    if user_id_lower == "alice":
        return {
            "theme": "dark",
            "language": "en",
            "notifications": True,
            "timezone": "America/New_York"
        }
    elif user_id_lower == "bob":
        return {
            "theme": "light",
            "language": "es",
            "notifications": False,
            "timezone": "Europe/Madrid"
        }
    else:
        return {
            "theme": "system",
            "language": "en",
            "notifications": True,
            "timezone": "UTC"
        }


def get_project_settings(project_id: str) -> dict[str, Any]:
    """
    Get project settings by project ID.
    In a real application, this would fetch from a database.
    
    Args:
        project_id: The project identifier
    
    Returns:
        Dictionary of project settings
    """
    project_id_lower = project_id.lower()
    
    if project_id_lower == "frontend":
        return {
            "framework": "React",
            "buildTool": "Vite",
            "testRunner": "Vitest",
            "linter": "ESLint",
            "deployTarget": "Vercel"
        }
    elif project_id_lower == "backend":
        return {
            "framework": "ASP.NET Core",
            "database": "PostgreSQL",
            "cache": "Redis",
            "testRunner": "xUnit",
            "deployTarget": "Azure"
        }
    elif project_id_lower == "mobile":
        return {
            "framework": "MAUI",
            "platforms": ["iOS", "Android"],
            "testRunner": "NUnit",
            "deployTarget": "App Store / Play Store"
        }
    else:
        return {
            "framework": "Unknown",
            "note": f"No configuration found for project '{project_id}'"
        }


async def main():
    """Main entry point for the server."""
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
    
    print("Resource Server started on http://localhost:5000", flush=True)
    print("Available resources:", flush=True)
    print("  - Static resources: handbook, coding-standards, api/endpoints", flush=True)
    print("  - Templates: user preferences, project settings", flush=True)
    
    # Run the server
    config = uvicorn.Config(web_app, host="0.0.0.0", port=5000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())
