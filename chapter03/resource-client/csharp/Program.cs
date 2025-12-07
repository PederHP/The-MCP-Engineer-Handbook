using ModelContextProtocol.Client;
using ModelContextProtocol.Protocol;

// Connect to the resource server
IClientTransport clientTransport = new HttpClientTransport(new()
{
    Endpoint = new Uri("http://localhost:5000")
});

await using var mcpClient = await McpClient.CreateAsync(clientTransport);

Console.WriteLine("=== MCP Resource Client Demo ===\n");

// 1. List all direct resources
Console.WriteLine("📚 Available Resources:");
Console.WriteLine(new string('-', 50));

var resources = await mcpClient.ListResourcesAsync();
foreach (var resource in resources)
{
    Console.WriteLine($"  Name: {resource.Name}");
    Console.WriteLine($"  URI:  {resource.Uri}");
    Console.WriteLine($"  Type: {resource.MimeType ?? "text/plain"}");
    if (!string.IsNullOrEmpty(resource.Description))
    {
        Console.WriteLine($"  Desc: {resource.Description}");
    }
    Console.WriteLine();
}

// 2. List all resource templates
Console.WriteLine("📋 Available Resource Templates:");
Console.WriteLine(new string('-', 50));

var templates = await mcpClient.ListResourceTemplatesAsync();
foreach (var template in templates)
{
    Console.WriteLine($"  Name: {template.Name}");
    Console.WriteLine($"  URI:  {template.UriTemplate}");
    Console.WriteLine($"  Type: {template.MimeType ?? "text/plain"}");
    if (!string.IsNullOrEmpty(template.Description))
    {
        Console.WriteLine($"  Desc: {template.Description}");
    }
    Console.WriteLine();
}

// 3. Read a specific resource
Console.WriteLine("📖 Reading 'Company Handbook' resource:");
Console.WriteLine(new string('-', 50));

var handbookResult = await mcpClient.ReadResourceAsync("docs://company/handbook");
foreach (var content in handbookResult.Contents)
{
    if (content is TextResourceContents textContent)
    {
        // Show first 500 chars to keep output manageable
        var preview = textContent.Text.Length > 500
            ? textContent.Text[..500] + "\n[... truncated ...]"
            : textContent.Text;
        Console.WriteLine(preview);
    }
}
Console.WriteLine();

// 4. Read a resource template with parameters
Console.WriteLine("👤 Reading User Preferences for 'alice':");
Console.WriteLine(new string('-', 50));

var alicePrefs = await mcpClient.ReadResourceAsync(
    "config://user/{userId}/preferences",
    new Dictionary<string, object?> { ["userId"] = "alice" });

foreach (var content in alicePrefs.Contents)
{
    if (content is TextResourceContents textContent)
    {
        Console.WriteLine(textContent.Text);
    }
}
Console.WriteLine();

// 5. Read another templated resource
Console.WriteLine("🏗️ Reading Project Settings for 'backend':");
Console.WriteLine(new string('-', 50));

var backendSettings = await mcpClient.ReadResourceAsync(
    "config://project/{projectId}/settings",
    new Dictionary<string, object?> { ["projectId"] = "backend" });

foreach (var content in backendSettings.Contents)
{
    if (content is TextResourceContents textContent)
    {
        Console.WriteLine(textContent.Text);
    }
}
Console.WriteLine();

Console.WriteLine("✅ Resource client demo complete!");
