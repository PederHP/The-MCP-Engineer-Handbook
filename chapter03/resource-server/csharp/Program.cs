using ModelContextProtocol;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;
using System.ComponentModel;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithResources<CompanyResources>();

var app = builder.Build();
app.MapMcp();
app.Run();

/// <summary>
/// Demo resources representing company documentation and user data.
/// These resources demonstrate both static resources and resource templates.
/// </summary>
[McpServerResourceType]
public sealed class CompanyResources
{
    /// <summary>
    /// Company handbook - a static markdown resource.
    /// </summary>
    [McpServerResource(
        UriTemplate = "docs://company/handbook",
        Name = "Company Handbook",
        MimeType = "text/markdown")]
    [Description("The company handbook with policies and guidelines")]
    public static string GetHandbook()
    {
        return """
            # Company Handbook

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
            """;
    }

    /// <summary>
    /// Coding standards - another static resource.
    /// </summary>
    [McpServerResource(
        UriTemplate = "docs://company/coding-standards",
        Name = "Coding Standards",
        MimeType = "text/markdown")]
    [Description("The coding standards and best practices guide")]
    public static string GetCodingStandards()
    {
        return """
            # Coding Standards

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
            """;
    }

    /// <summary>
    /// API documentation - a static resource with JSON content.
    /// </summary>
    [McpServerResource(
        UriTemplate = "docs://api/endpoints",
        Name = "API Endpoints",
        MimeType = "application/json")]
    [Description("Documentation of available API endpoints")]
    public static string GetApiEndpoints()
    {
        return """
            {
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
            """;
    }

    /// <summary>
    /// User preferences - a resource template that accepts a user ID.
    /// This demonstrates parameterized resources.
    /// </summary>
    [McpServerResource(
        UriTemplate = "config://user/{userId}/preferences",
        Name = "User Preferences",
        MimeType = "application/json")]
    [Description("User-specific preferences and settings")]
    public static TextResourceContents GetUserPreferences(string userId)
    {
        // In a real application, this would fetch from a database
        var preferences = userId.ToLowerInvariant() switch
        {
            "alice" => new { theme = "dark", language = "en", notifications = true, timezone = "America/New_York" },
            "bob" => new { theme = "light", language = "es", notifications = false, timezone = "Europe/Madrid" },
            _ => new { theme = "system", language = "en", notifications = true, timezone = "UTC" }
        };

        return new TextResourceContents
        {
            Uri = $"config://user/{userId}/preferences",
            MimeType = "application/json",
            Text = System.Text.Json.JsonSerializer.Serialize(preferences)
        };
    }

    /// <summary>
    /// Project configuration - a resource template for project-specific config.
    /// </summary>
    [McpServerResource(
        UriTemplate = "config://project/{projectId}/settings",
        Name = "Project Settings",
        MimeType = "application/json")]
    [Description("Project-specific configuration and settings")]
    public static TextResourceContents GetProjectSettings(string projectId)
    {
        // Use a dictionary for flexible JSON structure per project
        var settings = projectId.ToLowerInvariant() switch
        {
            "frontend" => new Dictionary<string, object>
            {
                ["framework"] = "React",
                ["buildTool"] = "Vite",
                ["testRunner"] = "Vitest",
                ["linter"] = "ESLint",
                ["deployTarget"] = "Vercel"
            },
            "backend" => new Dictionary<string, object>
            {
                ["framework"] = "ASP.NET Core",
                ["database"] = "PostgreSQL",
                ["cache"] = "Redis",
                ["testRunner"] = "xUnit",
                ["deployTarget"] = "Azure"
            },
            "mobile" => new Dictionary<string, object>
            {
                ["framework"] = "MAUI",
                ["platforms"] = new[] { "iOS", "Android" },
                ["testRunner"] = "NUnit",
                ["deployTarget"] = "App Store / Play Store"
            },
            _ => new Dictionary<string, object>
            {
                ["framework"] = "Unknown",
                ["note"] = $"No configuration found for project '{projectId}'"
            }
        };

        return new TextResourceContents
        {
            Uri = $"config://project/{projectId}/settings",
            MimeType = "application/json",
            Text = System.Text.Json.JsonSerializer.Serialize(settings)
        };
    }
}
