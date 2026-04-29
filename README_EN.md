# avc-test-js-mcp (Node.js)

[中文](https://github.com/z416479660/avc-test-js-mcp/blob/main/README.md) | English

[![npm version](https://img.shields.io/npm/v/avc-test-js-mcp)](https://www.npmjs.com/package/avc-test-js-mcp)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A video enhancement service based on the MCP protocol, acting as an MCP Client-Server to interact with a FastAPI HTTP Server.

## Features

Provides the following MCP Tools:
- `create_task` - Create a video enhancement task (supports URL or local file upload)
- `get_task_status` - Query task status
- `enhance_video_sync` - Synchronously enhance video (blocking wait)

## Prerequisites

- **Node.js >= 18** (check: `node --version`)
- **API Key** (required for authentication)

## Lazy Install (Recommended)

If your AI Agent has a known MCP config path, just copy the line below and send it to your AI:

```
Install the npm package avc-test-js-mcp as an MCP server. My API Key is: sk-xxxxxxxx.
```

The AI will automatically:
1. Detect your MCP client
2. Find the config file path
3. Write the correct configuration
4. Prompt you to restart the client

## Manual Install

No installation needed. Use `npx` directly in your MCP client config.

### 1. Claude Code (CLI)

Run in Claude Code:

```
/mcp
```

Check the output for the **"User MCPs"** section to find the config file path, then edit that file.

Common paths (if `/mcp` is unavailable):
- **Windows**: `%USERPROFILE%\.claude.json`
- **macOS**: `~/.claude.json`
- **Linux**: `~/.claude.json`
- **Legacy/Alternative**: `~/.claude/mcp.json`

Paste this (replace `your-api-key`):

```json
{
  "mcpServers": {
    "video-enhancement": {
      "command": "npx",
      "args": ["-y", "avc-test-js-mcp@latest"],
      "env": {
        "HTTP_API_KEY": "your-api-key"
      }
    }
  }
}
```

Save and run `/mcp` to verify it's loaded.

### 2. Cursor

Go to **Settings > Tools & MCPs > Add New MCP Server**:

- **Name**: `video-enhancement`
- **Type**: `command`
- **Command**:
  ```bash
  env HTTP_API_KEY=your-api-key npx -y avc-test-js-mcp@latest
  ```

Or edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "video-enhancement": {
      "command": "npx",
      "args": ["-y", "avc-test-js-mcp@latest"],
      "env": {
        "HTTP_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Verify Installation

After restarting your client, check if the tools are available:

1. Or ask: "What tools do you have available?"
2. You should see: `create_task`, `get_task_status`, `enhance_video_sync`

## Configuration Options

| Variable | Required | Default | Description |
|---|---|---|---|
| `HTTP_API_KEY` | **Yes** | - | API authentication key |
| `HTTP_API_BASE_URL` | No | `https://mcp.luluhero.com` | Service endpoint |

### Custom Endpoint

```json
{
  "env": {
    "HTTP_API_BASE_URL": "https://your-endpoint.com",
    "HTTP_API_KEY": "your-api-key"
  }
}
```

Or via CLI args:
```bash
npx -y avc-test-js-mcp@latest --base-url https://your-endpoint.com --api-key your-api-key
```

## Usage Examples

Once configured, ask your AI agent naturally:

> "Enhance this video to 1080p: https://example.com/video.mp4"

> "Improve the quality of /Users/me/Desktop/video.mp4 to 2k"

The agent will automatically call the appropriate tools.

## Provided Tools

### create_task

Create an asynchronous video enhancement task.

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `video_source` | string | Yes | - | Video URL or local file path |
| `type` | string | No | `url` | `url` or `local` |
| `resolution` | string | No | `720p` | `480p`, `540p`, `720p`, `1080p`, `2k` |

**Returns:**
```json
{
  "success": true,
  "task_id": "xxx",
  "status": "wait"
}
```

### get_task_status

Query task status.

| Parameter | Type | Required |
|---|---|---|
| `task_id` | string | Yes |

**Returns:**
```json
{
  "success": true,
  "task_id": "xxx",
  "status": "completed",
  "progress": 100,
  "video_url": "https://..."
}
```

### enhance_video_sync

Synchronously enhance video (blocks until completion).

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `video_source` | string | Yes | - | Video URL or local file path |
| `type` | string | No | `url` | `url` or `local` |
| `resolution` | string | No | `720p` | Target resolution |
| `poll_interval` | number | No | `5` | Poll interval (seconds) |
| `timeout` | number | No | `600` | Timeout (seconds) |

## File Upload Notes

When `type` is `"local"`:
1. File is read locally by the MCP Server
2. Uploaded directly to TOS object storage via pre-signed URL
3. **Max file size: 100MB**

## Troubleshooting

### "command not found: npx"

Install Node.js >= 18: https://nodejs.org/

### "Error:需要提供 --api-key 或设置 HTTP_API_KEY"

Your API Key is missing. Double-check the `env.HTTP_API_KEY` in your config.

### MCP Server shows red/error in client

Check logs:
- **Claude Desktop macOS**: `~/Library/Logs/Claude/mcp*.log`
- **Claude Desktop Windows**: `%APPDATA%\Claude\logs\mcp*.log`
- **Cursor**: Output panel > MCP

### "TOS 上传失败"

Usually a signature mismatch. Ensure your `HTTP_API_BASE_URL` and `HTTP_API_KEY` are correct and active.

## Global Install (Alternative)

If you prefer not using `npx` every time:

```bash
npm install -g avc-test-js-mcp
```

Then use `"command": "avc-test-js-mcp"` with `"args": ["--api-key", "your-api-key"]` in your config.

## License

MIT License - See [LICENSE](LICENSE) file for details
