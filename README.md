# avc-test-js-mcp (Node.js)

[![npm version](https://badge.fury.io/js/avc-test-js-mcp.svg)](https://www.npmjs.com/package/avc-test-js-mcp)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于 MCP 协议的视频增强服务，作为 MCP Client-Server 与 FastAPI HTTP Server 交互。

## 功能

提供以下 MCP Tools：
- `create_task` - 创建视频增强任务（支持 URL 或本地文件上传）
- `get_task_status` - 查询任务状态
- `enhance_video_sync` - 同步增强视频（阻塞等待）

## 安装

### 从 npm 安装（推荐）

```bash
npm install -g avc-test-js-mcp
```

或使用 yarn/pnpm：
```bash
yarn global add avc-test-js-mcp
pnpm add -g avc-test-js-mcp
```

### 从源码安装

```bash
git clone https://github.com/yourusername/avc-test-js-mcp.git
cd js_client
npm install
npm run build
```

## 使用方法

### 1. 命令行启动

全局安装后直接使用：
```bash
avc-test-js-mcp --base-url https://mcp.luluhero.com --api-key your-api-key
```

或使用环境变量：
```bash
# Windows PowerShell
$env:HTTP_API_BASE_URL="https://mcp.luluhero.com"
$env:HTTP_API_KEY="your-api-key"
avc-test-js-mcp

# Windows CMD
set HTTP_API_BASE_URL=https://mcp.luluhero.com
set HTTP_API_KEY=your-api-key
avc-test-js-mcp

# macOS/Linux
export HTTP_API_BASE_URL=https://mcp.luluhero.com
export HTTP_API_KEY=your-api-key
avc-test-js-mcp
```

### 2. 在 Claude Desktop 中配置

编辑 Claude Desktop 配置文件：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "video-enhancement": {
      "command": "avc-test-js-mcp",
      "args": [
        "--base-url",
        "https://mcp.luluhero.com",
        "--api-key",
        "your-api-key"
      ]
    }
  }
}
```

### 3. 使用 npx（无需全局安装）

```bash
npx avc-test-js-mcp --base-url https://mcp.luluhero.com --api-key your-api-key
```

Claude Desktop 配置：
```json
{
  "mcpServers": {
    "video-enhancement": {
      "command": "npx",
      "args": [
        "avc-test-js-mcp",
        "--base-url",
        "https://mcp.luluhero.com",
        "--api-key",
        "your-api-key"
      ]
    }
  }
}
```

## 提供的 Tools

### create_task

创建视频增强任务（异步）。

**参数：**
- `video_source` (string, required): 视频 URL 或本地文件路径
- `type` (string, optional): 上传类型，默认 "url"
  - 可选值: `"url"` - 网络视频URL, `"local"` - 本地文件路径
- `resolution` (string, optional): 目标分辨率，默认 720p
  - 可选值: 480p, 540p, 720p, 1080p, 2k

**使用示例：**
```json
// URL 方式
{
  "video_source": "https://example.com/video.mp4",
  "type": "url",
  "resolution": "1080p"
}

// 本地文件方式
{
  "video_source": "/path/to/local/video.mp4",
  "type": "local",
  "resolution": "1080p"
}
```

**返回值：**
```json
{
  "success": true,
  "task_id": "xxx",
  "status": "wait"
}
```

### get_task_status

查询任务状态。

**参数：**
- `task_id` (string, required): 任务ID

**使用示例：**
```json
{
  "task_id": "task-123-abc"
}
```

**返回值：**
```json
{
  "success": true,
  "task_id": "xxx",
  "status": "completed",
  "progress": 100,
  "video_url": "https://...",
  "error_message": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:01:00Z"
}
```

### enhance_video_sync

同步增强视频（阻塞等待完成）。

**参数：**
- `video_source` (string, required): 视频 URL 或本地文件路径
- `type` (string, optional): 上传类型，默认 "url"
  - 可选值: `"url"` - 网络视频URL, `"local"` - 本地文件路径
- `resolution` (string, optional): 目标分辨率，默认 720p
- `poll_interval` (number, optional): 轮询间隔（秒），默认 5
- `timeout` (number, optional): 超时时间（秒），默认 600

**使用示例：**
```json
{
  "video_source": "https://example.com/video.mp4",
  "type": "url",
  "resolution": "1080p",
  "poll_interval": 5,
  "timeout": 600
}
```

**返回值：**
```json
{
  "success": true,
  "task_id": "xxx",
  "status": "completed",
  "progress": 100,
  "video_url": "https://..."
}
```

## 文件上传说明

当 `type` 设置为 `"local"` 时，MCP Server 会：
1. 读取本地文件
2. 将文件转为 base64 编码
3. 上传到视频增强服务

**限制：**
- 最大文件大小：100MB

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `HTTP_API_BASE_URL` | FastAPI HTTP Server 地址 | `https://mcp.luluhero.com` |
| `HTTP_API_KEY` | API 认证密钥 | 无 |

## 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/avc-test-js-mcp.git
cd js_client

# 安装依赖
npm install

# 开发模式（自动编译）
npm run dev

# 构建
npm run build
```

## License

MIT License - 详见 [LICENSE](LICENSE) 文件
