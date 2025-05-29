# Nutrient Document Engine MCP Server

This MCP server provides access to documents and layers within a Nutrient Document Engine instance. It allows AI assistants to list documents, view document details including layers and annotations, search for documents, and create annotations.

## Features

- List all documents in a Document Engine instance
- View document details, including layers and annotations
- Search for documents by query
- Create annotations in documents

## Installation

You can install and run this server using npm:

```bash
npm install -g @modelcontextprotocol/server-nutrient-document-engine
```

Or run it directly with npx:

```bash
npx @modelcontextprotocol/server-nutrient-document-engine
```

## Configuration

The server requires the following environment variables:

- `DOCUMENT_ENGINE_BASE_URL`: The base URL of your Nutrient Document Engine instance
- `DOCUMENT_ENGINE_API_SECRET`: The API secret token for authentication

You can set these variables in a `.env` file in the same directory as the server, or provide them when running the server:

```bash
DOCUMENT_ENGINE_BASE_URL=https://your-document-engine-instance.com \
DOCUMENT_ENGINE_API_SECRET=your-api-secret \
npx @modelcontextprotocol/server-nutrient-document-engine
```

## Usage with Claude Desktop

To use this server with Claude Desktop, add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "nutrient-document-engine": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-nutrient-document-engine"],
      "env": {
        "DOCUMENT_ENGINE_BASE_URL": "https://your-document-engine-instance.com",
        "DOCUMENT_ENGINE_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

## Available Resources

The server exposes documents as resources with the following URI format:

```
nutrient-document-engine:///{document-id}
```

When reading a resource, the server returns a JSON object containing:
- Document metadata (ID, title, page count)
- Layers in the document
- Annotations in the document

## Available Tools

### search

Search for documents in the Document Engine instance.

**Parameters:**
- `query`: The search query string

**Example:**
```
Use the search tool to find documents containing "invoice"
```

### create_annotation

Create a new annotation in a document.

**Parameters:**
- `documentId`: The ID of the document
- `type`: The annotation type (note, highlight, ink, text, stamp, image, link)
- `page`: The page number (1-based)
- `content`: The annotation content object

**Example:**
```
Create a note annotation on page 1 of document abc123 with the content "This is important"
```

## Docker

You can also run the server using Docker:

```bash
# Build the Docker image
docker build -t nutrient-document-engine-mcp .

# Run the Docker container
docker run -e DOCUMENT_ENGINE_BASE_URL=https://your-document-engine-instance.com \
           -e DOCUMENT_ENGINE_API_SECRET=your-api-secret \
           nutrient-document-engine-mcp
```

## Development

To build the server from source:

```bash
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/src/nutrient-document-engine
npm install
npm run build
```
