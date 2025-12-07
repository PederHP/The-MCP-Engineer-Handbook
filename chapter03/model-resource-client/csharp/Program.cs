using Microsoft.Extensions.AI;
using OllamaSharp;
using ModelContextProtocol.Client;
using ModelContextProtocol.Protocol;

// Connect to the MCP resource server
IClientTransport clientTransport = new HttpClientTransport(new()
{
    Endpoint = new Uri("http://localhost:5000")
});

await using var mcpClient = await McpClient.CreateAsync(clientTransport);

Console.WriteLine("=== Model Resource Client (Pattern 3) ===");
Console.WriteLine("This sample gives the AI model agency over resource access.\n");

// Create tool wrappers for resource operations
// These let the model decide when to list or read resources

var listResourcesTool = AIFunctionFactory.Create(
    async () =>
    {
        Console.WriteLine("\n[Tool Call: list_resources]");
        var resources = await mcpClient.ListResourcesAsync();
        var result = resources.Select(r => new
        {
            name = r.Name,
            uri = r.Uri,
            description = r.Description,
            mimeType = r.MimeType
        }).ToList();

        var json = System.Text.Json.JsonSerializer.Serialize(result,
            new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        Console.WriteLine($"[Returned {resources.Count} resources]\n");
        return json;
    },
    "list_resources",
    "Lists all available resources from the MCP server. Returns a JSON array of resources with their names, URIs, descriptions, and MIME types."
);

var listResourceTemplatesTool = AIFunctionFactory.Create(
    async () =>
    {
        Console.WriteLine("\n[Tool Call: list_resource_templates]");
        var templates = await mcpClient.ListResourceTemplatesAsync();
        var result = templates.Select(t => new
        {
            name = t.Name,
            uriTemplate = t.UriTemplate,
            description = t.Description,
            mimeType = t.MimeType
        }).ToList();

        var json = System.Text.Json.JsonSerializer.Serialize(result,
            new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        Console.WriteLine($"[Returned {templates.Count} templates]\n");
        return json;
    },
    "list_resource_templates",
    "Lists all available resource templates from the MCP server. Templates have URI patterns with placeholders like {userId} that need to be filled in when reading."
);

var readResourceTool = AIFunctionFactory.Create(
    async (string uri) =>
    {
        Console.WriteLine($"\n[Tool Call: read_resource(\"{uri}\")]");
        try
        {
            var result = await mcpClient.ReadResourceAsync(uri);
            var contents = new List<string>();

            foreach (var content in result.Contents)
            {
                if (content is TextResourceContents textContent)
                {
                    contents.Add(textContent.Text);
                }
                else if (content is BlobResourceContents blobContent)
                {
                    contents.Add($"[Binary content: {blobContent.MimeType}, {blobContent.Blob.Length} bytes base64]");
                }
            }

            var text = string.Join("\n---\n", contents);
            Console.WriteLine($"[Returned {text.Length} characters]\n");
            return text;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error: {ex.Message}]\n");
            return $"Error reading resource: {ex.Message}";
        }
    },
    "read_resource",
    "Reads the content of a specific resource by its URI. For templated resources, provide the full URI with placeholders filled in (e.g., 'config://user/alice/preferences')."
);

// Collect all resource tools
List<AITool> resourceTools = [listResourcesTool, listResourceTemplatesTool, readResourceTool];

Console.WriteLine("Resource tools available to model:");
foreach (var tool in resourceTools)
{
    Console.WriteLine($"  - {tool.Name}");
}
Console.WriteLine();

// Set up the LLM chat client with a local model
var ollamaUri = new Uri("http://127.0.0.1:11434");
var model = "qwen3:1.7b";

Console.WriteLine($"Connecting to Ollama ({model})...\n");

IChatClient chatClient = new ChatClientBuilder(new OllamaApiClient(ollamaUri, model))
    .UseFunctionInvocation()
    .Build();

// System message to guide the model
var systemMessage = """
    You are a helpful assistant with access to a company's resource system.
    You can list and read resources to help answer questions.

    Available tools:
    - list_resources: See what static resources are available
    - list_resource_templates: See what templated resources are available
    - read_resource: Read the content of a specific resource by URI

    When users ask about company policies, coding standards, user preferences,
    or project settings, use these tools to find and retrieve the relevant information.

    Always check what resources are available before trying to read them.
    """;

List<ChatMessage> chatHistory = [new ChatMessage(ChatRole.System, systemMessage)];

Console.WriteLine("Chat with the AI! Try asking things like:");
Console.WriteLine("  - 'What resources are available?'");
Console.WriteLine("  - 'What are the company's core values?'");
Console.WriteLine("  - 'Show me the coding standards'");
Console.WriteLine("  - 'What are Alice's preferences?'");
Console.WriteLine("  - 'What framework does the backend project use?'");
Console.WriteLine("\nType 'quit' to exit.\n");

while (true)
{
    Console.Write("You: ");
    var userPrompt = Console.ReadLine();

    if (string.IsNullOrWhiteSpace(userPrompt))
        continue;

    if (userPrompt.Equals("quit", StringComparison.OrdinalIgnoreCase))
        break;

    chatHistory.Add(new ChatMessage(ChatRole.User, userPrompt));

    Console.Write("\nAssistant: ");
    var response = "";

    await foreach (ChatResponseUpdate item in
        chatClient.GetStreamingResponseAsync(chatHistory, new ChatOptions()
        {
            Tools = resourceTools
        }))
    {
        Console.Write(item.Text);
        response += item.Text;
    }

    chatHistory.Add(new ChatMessage(ChatRole.Assistant, response));
    Console.WriteLine("\n");
}

Console.WriteLine("Goodbye!");
