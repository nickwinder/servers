#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

// Configuration
const BASE_URL = process.env.DOCUMENT_ENGINE_BASE_URL || "";
const API_SECRET = process.env.DOCUMENT_ENGINE_API_SECRET || "";

if (!BASE_URL) {
  console.error("Error: DOCUMENT_ENGINE_BASE_URL environment variable is required");
  process.exit(1);
}

if (!API_SECRET) {
  console.error("Error: DOCUMENT_ENGINE_API_SECRET environment variable is required");
  process.exit(1);
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Token token="${API_SECRET}"`,
    'Content-Type': 'application/json',
  },
});

// Create MCP server
const server = new Server(
  {
    name: "nutrient-document-engine",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

// Handler for listing documents
server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
  try {
    const params: any = {};

    if (request.params?.cursor) {
      params.page = request.params.cursor;
    }

    const response = await api.get('/api/documents', { params });
    const documents = response.data.data;

    return {
      resources: documents.map((doc: any) => ({
        uri: `nutrient-document-engine:///${doc.id}`,
        mimeType: "application/pdf",
        name: doc.attributes.title || `Document ${doc.id}`,
      })),
      nextCursor: response.data.meta.pagination.next_page || undefined,
    };
  } catch (error) {
    console.error("Error listing documents:", error);
    throw new Error("Failed to list documents");
  }
});

// Handler for reading document content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  try {
    const documentId = request.params.uri.replace("nutrient-document-engine:///", "");

    // Get document metadata
    const docResponse = await api.get(`/api/documents/${documentId}`);
    const document = docResponse.data.data;

    // Get document layers
    const layersResponse = await api.get(`/api/documents/${documentId}/layers`);
    const layers = layersResponse.data.data;

    // Get annotations
    const annotationsResponse = await api.get(`/api/documents/${documentId}/annotations`);
    const annotations = annotationsResponse.data.data;

    // Compile document information
    const documentInfo = {
      id: document.id,
      title: document.attributes.title,
      pageCount: document.attributes.page_count,
      layers: layers.map((layer: any) => ({
        id: layer.id,
        name: layer.attributes.name,
        visible: layer.attributes.visible,
      })),
      annotations: annotations.map((annotation: any) => ({
        id: annotation.id,
        type: annotation.attributes.type,
        page: annotation.attributes.page,
        content: annotation.attributes.content,
      })),
    };

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(documentInfo, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("Error reading document:", error);
    throw new Error("Failed to read document");
  }
});

// Handler for listing tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description: "Search for documents in Nutrient Document Engine",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "create_annotation",
        description: "Create an annotation in a document",
        inputSchema: {
          type: "object",
          properties: {
            documentId: {
              type: "string",
              description: "Document ID",
            },
            type: {
              type: "string",
              description: "Annotation type",
              enum: ["note", "highlight", "ink", "text", "stamp", "image", "link"],
            },
            page: {
              type: "number",
              description: "Page number (1-based)",
            },
            content: {
              type: "object",
              description: "Annotation content",
            },
          },
          required: ["documentId", "type", "page", "content"],
        },
      },
    ],
  };
});

// Handler for calling tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search") {
    try {
      const query = request.params.arguments?.query as string;

      const response = await api.get('/api/documents', { 
        params: { 
          filter: { query } 
        } 
      });

      const documents = response.data.data;

      const documentList = documents.map((doc: any) => 
        `${doc.attributes.title || `Document ${doc.id}`} (ID: ${doc.id})`
      ).join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${documents.length} documents:\n${documentList}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      console.error("Error searching documents:", error);
      return {
        content: [
          {
            type: "text",
            text: "Failed to search documents. Please try again.",
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === "create_annotation") {
    try {
      const { documentId, type, page, content } = request.params.arguments as any;

      const response = await api.post(`/api/documents/${documentId}/annotations`, {
        data: {
          type: "annotations",
          attributes: {
            type,
            page,
            content,
          },
        },
      });

      const annotation = response.data.data;

      return {
        content: [
          {
            type: "text",
            text: `Successfully created ${type} annotation with ID: ${annotation.id}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      console.error("Error creating annotation:", error);
      return {
        content: [
          {
            type: "text",
            text: "Failed to create annotation. Please check your inputs and try again.",
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error("Tool not found");
});

// Start the server
async function startServer() {
  console.error("Starting Nutrient Document Engine MCP server...");
  console.error(`Base URL: ${BASE_URL}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

startServer().catch(console.error);
