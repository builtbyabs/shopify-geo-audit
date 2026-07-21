#!/usr/bin/env node
// Thin launcher so `npx -y shopify-geo-audit-mcp` starts the stdio MCP server.
// The server itself lives in the main package; this package only exists so the
// default bin *is* the server (MCP clients run `npx -y <package>`).
import 'shopify-geo-audit/dist/mcp-server.js';
