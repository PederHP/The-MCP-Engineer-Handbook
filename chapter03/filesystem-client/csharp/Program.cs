using ModelContextProtocol.Client;
using ModelContextProtocol.Protocol;

/// <summary>
/// FileSystem Resource Client
///
/// This sample demonstrates:
/// 1. Listing dynamically-loaded resources from a folder
/// 2. Reading text resources (markdown, json, text)
/// 3. Reading binary resources (images as base64)
///
/// Requires: filesystem-server running on port 5002
/// </summary>

Console.WriteLine("=== FileSystem Resource Client ===\n");

// Connect to the FileSystem server
IClientTransport clientTransport = new HttpClientTransport(new()
{
    Endpoint = new Uri("http://localhost:5002")
});

await using var mcpClient = await McpClient.CreateAsync(clientTransport);
Console.WriteLine("Connected to FileSystem server.\n");

// List all resources
var resources = await mcpClient.ListResourcesAsync();
Console.WriteLine($"Found {resources.Count} resources:\n");

foreach (var resource in resources)
{
    Console.WriteLine($"  URI: {resource.Uri}");
    Console.WriteLine($"  Name: {resource.Name}");
    Console.WriteLine($"  MIME: {resource.MimeType}");
    Console.WriteLine($"  Description: {resource.Description}");
    Console.WriteLine();
}

// Test reading each resource
Console.WriteLine(new string('=', 60));
Console.WriteLine("Reading each resource:\n");

foreach (var resource in resources)
{
    Console.WriteLine($"--- {resource.Name} ({resource.MimeType}) ---");

    var result = await mcpClient.ReadResourceAsync(resource.Uri);

    foreach (var content in result.Contents)
    {
        if (content is TextResourceContents textContent)
        {
            Console.WriteLine("[TEXT RESOURCE]");
            // Show first 200 chars or full content if shorter
            var preview = textContent.Text.Length > 200
                ? textContent.Text[..200] + "..."
                : textContent.Text;
            Console.WriteLine(preview);
        }
        else if (content is BlobResourceContents blobContent)
        {
            Console.WriteLine("[BINARY RESOURCE (base64)]");
            var blob = blobContent.Blob;
            Console.WriteLine($"Base64 length: {blob.Length} chars");
            Console.WriteLine($"Preview: {blob[..Math.Min(60, blob.Length)]}...");

            // Decode and show byte count
            var bytes = Convert.FromBase64String(blob);
            Console.WriteLine($"Decoded: {bytes.Length} bytes");

            // For PNG, verify magic bytes
            if (resource.MimeType == "image/png" && bytes.Length >= 8)
            {
                var isPng = bytes[0] == 0x89 && bytes[1] == 0x50 &&
                            bytes[2] == 0x4E && bytes[3] == 0x47;
                Console.WriteLine($"Valid PNG header: {isPng}");
            }
        }
    }
    Console.WriteLine();
}

Console.WriteLine("=== Test Complete ===");
