using ModelContextProtocol;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

/// <summary>
/// FileSystem Resource Server
///
/// This sample demonstrates:
/// 1. Dynamic resource loading from a folder (not attribute-based)
/// 2. Binary resource support (images, etc.)
/// 3. Using handlers instead of attributed methods
/// 4. MIME type detection from file extensions
///
/// Run with: dotnet run -- [path-to-folder]
/// Default: ./sample-resources
/// </summary>

// Get the resource folder from args, skipping any dotnet runtime args (--urls, etc.)
var folderArg = args.FirstOrDefault(a => !a.StartsWith("--"));
var resourceFolder = folderArg ?? Path.Combine(Directory.GetCurrentDirectory(), "sample-resources");

if (!Directory.Exists(resourceFolder))
{
    Console.Error.WriteLine($"Creating sample resources folder: {resourceFolder}");
    Directory.CreateDirectory(resourceFolder);
    CreateSampleFiles(resourceFolder);
}

Console.Error.WriteLine($"Serving resources from: {resourceFolder}");

var builder = WebApplication.CreateBuilder(args);

// Configure MCP server with dynamic resource handlers
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithListResourcesHandler(async (context, cancellationToken) =>
    {
        // Dynamically list all files in the resource folder
        var resources = new List<Resource>();

        foreach (var filePath in Directory.GetFiles(resourceFolder, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(resourceFolder, filePath);
            var uri = $"file://resources/{relativePath.Replace('\\', '/')}";
            var mimeType = GetMimeType(filePath);
            var fileInfo = new FileInfo(filePath);

            resources.Add(new Resource
            {
                Uri = uri,
                Name = Path.GetFileName(filePath),
                Description = $"File: {relativePath} ({FormatFileSize(fileInfo.Length)})",
                MimeType = mimeType,
                Size = fileInfo.Length
            });
        }

        Console.Error.WriteLine($"Listed {resources.Count} resources");

        return new ListResourcesResult { Resources = resources };
    })
    .WithReadResourceHandler(async (context, cancellationToken) =>
    {
        var uri = context.Params?.Uri;
        if (string.IsNullOrEmpty(uri))
        {
            throw new McpProtocolException("Missing URI parameter", McpErrorCode.InvalidParams);
        }

        // Parse the URI to get the file path
        // Expected format: file://resources/path/to/file.ext
        const string prefix = "file://resources/";
        if (!uri.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new McpProtocolException($"Invalid URI format: {uri}", McpErrorCode.InvalidParams);
        }

        var relativePath = uri[prefix.Length..];
        var filePath = Path.Combine(resourceFolder, relativePath.Replace('/', Path.DirectorySeparatorChar));

        // Security: Ensure we're not escaping the resource folder
        var fullPath = Path.GetFullPath(filePath);
        var fullResourceFolder = Path.GetFullPath(resourceFolder);
        if (!fullPath.StartsWith(fullResourceFolder))
        {
            throw new McpProtocolException("Access denied: path traversal attempt", McpErrorCode.InvalidParams);
        }

        if (!File.Exists(fullPath))
        {
            throw new McpProtocolException($"Resource not found: {uri}", McpErrorCode.InvalidParams);
        }

        var mimeType = GetMimeType(fullPath);
        Console.Error.WriteLine($"Reading resource: {relativePath} ({mimeType})");

        // Determine if this is a text or binary file
        if (IsTextMimeType(mimeType))
        {
            // Text resource
            var text = await File.ReadAllTextAsync(fullPath, cancellationToken);
            return new ReadResourceResult
            {
                Contents =
                [
                    new TextResourceContents
                    {
                        Uri = uri,
                        MimeType = mimeType,
                        Text = text
                    }
                ]
            };
        }
        else
        {
            // Binary resource (images, etc.)
            var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
            var base64 = Convert.ToBase64String(bytes);

            return new ReadResourceResult
            {
                Contents =
                [
                    new BlobResourceContents
                    {
                        Uri = uri,
                        MimeType = mimeType,
                        Blob = base64
                    }
                ]
            };
        }
    });

var app = builder.Build();
app.MapMcp();

Console.Error.WriteLine("FileSystem Resource Server started on http://localhost:5000");
app.Run();


// === Helper Functions ===

static string GetMimeType(string filePath)
{
    var extension = Path.GetExtension(filePath).ToLowerInvariant();
    return extension switch
    {
        // Text types
        ".txt" => "text/plain",
        ".md" => "text/markdown",
        ".html" or ".htm" => "text/html",
        ".css" => "text/css",
        ".csv" => "text/csv",
        ".xml" => "text/xml",

        // Application types
        ".json" => "application/json",
        ".js" => "application/javascript",
        ".pdf" => "application/pdf",
        ".zip" => "application/zip",

        // Image types
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".gif" => "image/gif",
        ".svg" => "image/svg+xml",
        ".ico" => "image/x-icon",
        ".webp" => "image/webp",
        ".bmp" => "image/bmp",

        // Code types (treat as text)
        ".cs" => "text/x-csharp",
        ".py" => "text/x-python",
        ".ts" => "text/typescript",
        ".rs" => "text/x-rust",
        ".go" => "text/x-go",
        ".java" => "text/x-java",
        ".cpp" or ".cc" or ".cxx" => "text/x-c++",
        ".c" or ".h" => "text/x-c",
        ".sh" => "text/x-shellscript",
        ".yaml" or ".yml" => "text/yaml",

        _ => "application/octet-stream"
    };
}

static bool IsTextMimeType(string mimeType)
{
    return mimeType.StartsWith("text/", StringComparison.OrdinalIgnoreCase)
        || mimeType == "application/json"
        || mimeType == "application/javascript"
        || mimeType == "image/svg+xml"; // SVG is XML-based text
}

static string FormatFileSize(long bytes)
{
    string[] suffixes = ["B", "KB", "MB", "GB"];
    int counter = 0;
    decimal number = bytes;
    while (Math.Round(number / 1024) >= 1 && counter < suffixes.Length - 1)
    {
        number /= 1024;
        counter++;
    }
    return $"{number:n1} {suffixes[counter]}";
}

static void CreateSampleFiles(string folder)
{
    // Create sample text file
    File.WriteAllText(Path.Combine(folder, "readme.md"), """
        # Sample Resources

        This folder contains sample resources for the FileSystem Resource Server demo.

        ## Contents
        - readme.md (this file)
        - config.json (sample configuration)
        - notes.txt (plain text notes)
        - logo.png (sample image - demonstrates binary resources)
        """);

    // Create sample JSON
    File.WriteAllText(Path.Combine(folder, "config.json"), """
        {
          "appName": "FileSystem Resource Server Demo",
          "version": "1.0.0",
          "settings": {
            "maxFileSize": "10MB",
            "allowedExtensions": [".txt", ".md", ".json", ".png", ".jpg"],
            "cacheEnabled": true
          }
        }
        """);

    // Create sample text file
    File.WriteAllText(Path.Combine(folder, "notes.txt"), """
        Development Notes
        ==================

        This server demonstrates dynamic resource loading from a filesystem.

        Key features:
        - Files are discovered dynamically (no hardcoded list)
        - Binary files (images) are served as base64-encoded blobs
        - Text files are served as plain text
        - MIME types are inferred from file extensions

        Try adding more files to this folder and they'll appear automatically!
        """);

    // Create a minimal PNG image (1x1 red pixel)
    // This is a valid PNG file that demonstrates binary resource support
    byte[] minimalPng =
    [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // "IHDR"
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02,             // bit depth: 8, color type: 2 (RGB)
        0x00, 0x00, 0x00,       // compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE, // IHDR CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // "IDAT"
        0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, // compressed data (red pixel)
        0x01, 0x01, 0x01, 0x00, // Adler-32 checksum
        0x1B, 0xB6, 0xEE, 0x56, // IDAT CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // "IEND"
        0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ];
    File.WriteAllBytes(Path.Combine(folder, "logo.png"), minimalPng);

    Console.Error.WriteLine("Created sample files in resource folder");
}
