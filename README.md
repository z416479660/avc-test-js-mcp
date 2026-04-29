# avc-test-js-mcp (Node.js)

中文 | [English](README_EN.md)

[![npm version](https://badge.fury.io/js/avc-test-js-mcp.svg)](https://www.npmjs.com/package/avc-test-js-mcp)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于 MCP 协议的视频增强服务，作为 MCP Client-Server 与 FastAPI HTTP Server 交互。

## 功能

提供以下 MCP Tools：
- `create_task` - 创建视频增强任务（支持 URL 或本地文件上传）
- `get_task_status` - 查询任务状态
- `enhance_video_sync` - 同步增强视频（阻塞等待完成）

## 前置要求

- **Node.js >= 18**（检查：`node --version`）
- **API Key**（用于身份认证，请联系服务提供方获取）

## 快速开始

无需安装，直接在 MCP 客户端配置中使用 `npx` 运行。

### 1. Claude Desktop

**macOS：**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows：**
```powershell
notepad $env:AppData\Claude\claude_desktop_config.json
```

粘贴以下内容（将 `your-api-key` 替换为实际 API Key）：

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

保存后**完全重启** Claude Desktop。

### 2. Cursor

进入 **设置 > MCP Servers > Add New MCP Server**：

- **Name**：`video-enhancement`
- **Type**：`command`
- **Command**：
  ```bash
  env HTTP_API_KEY=your-api-key npx -y avc-test-js-mcp@latest
  ```

或编辑 `~/.cursor/mcp.json`：

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

### 3. Cline (VS Code 插件)

在 Cline 设置 > MCP Servers 中添加：

```json
{
  "mcpServers": [
    {
      "name": "video-enhancement",
      "command": "npx",
      "args": ["-y", "avc-test-js-mcp@latest"],
      "env": {
        "HTTP_API_KEY": "your-api-key"
      }
    }
  ]
}
```

### 4. 其他 MCP 客户端（通用 stdio）

```bash
npx -y avc-test-js-mcp@latest --api-key your-api-key
```

或使用环境变量：

```bash
export HTTP_API_KEY=your-api-key
npx -y avc-test-js-mcp@latest
```

## 验证安装

重启客户端后，确认工具是否加载成功：

1. Claude Desktop 输入框右下角查看是否有 🔨 锤子图标
2. 或直接问 AI："你有哪些可用的工具？"
3. 应看到：`create_task`、`get_task_status`、`enhance_video_sync`

## 配置项

| 变量名 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `HTTP_API_KEY` | **是** | - | API 认证密钥 |
| `HTTP_API_BASE_URL` | 否 | `https://mcp.luluhero.com` | 服务接口地址 |

### 自定义服务地址

```json
{
  "env": {
    "HTTP_API_BASE_URL": "https://your-endpoint.com",
    "HTTP_API_KEY": "your-api-key"
  }
}
```

或通过命令行参数：
```bash
npx -y avc-test-js-mcp@latest --base-url https://your-endpoint.com --api-key your-api-key
```

## 使用示例

配置完成后，用自然语言对 AI 说：

> "帮我把这个视频增强到 1080p：https://example.com/video.mp4"

> "把我桌面的 video.mp4 提升到 2k 画质"

AI 会自动调用相应工具完成任务。

## 提供的 Tools

### create_task

创建视频增强任务（异步）。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `video_source` | string | 是 | - | 视频 URL 或本地文件路径 |
| `type` | string | 否 | `url` | `url` 或 `local` |
| `resolution` | string | 否 | `720p` | `480p`、`540p`、`720p`、`1080p`、`2k` |

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

| 参数 | 类型 | 必填 |
|---|---|---|
| `task_id` | string | 是 |

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

### enhance_video_sync

同步增强视频（阻塞等待完成）。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `video_source` | string | 是 | - | 视频 URL 或本地文件路径 |
| `type` | string | 否 | `url` | `url` 或 `local` |
| `resolution` | string | 否 | `720p` | 目标分辨率 |
| `poll_interval` | number | 否 | `5` | 轮询间隔（秒） |
| `timeout` | number | 否 | `600` | 超时时间（秒） |

## 文件上传说明

当 `type` 为 `"local"` 时，MCP Server 会：
1. 读取本地文件
2. 通过预签名 URL 直传到 TOS 对象存储
3. **最大文件大小：100MB**

## 故障排查

### "command not found: npx"

安装 Node.js >= 18：https://nodejs.org/

### "错误: 需要提供 --api-key 或设置 HTTP_API_KEY"

API Key 缺失，请检查配置中的 `env.HTTP_API_KEY`。

### MCP Server 在客户端显示红色/错误

查看日志：
- **Claude Desktop macOS**：`~/Library/Logs/Claude/mcp*.log`
- **Claude Desktop Windows**：`%APPDATA%\Claude\logs\mcp*.log`
- **Cursor**：Output 面板 > MCP

### "TOS 上传失败"

通常是签名不匹配，请确认 `HTTP_API_BASE_URL` 和 `HTTP_API_KEY` 正确且有效。

## 全局安装（可选）

如果你不想每次都用 `npx`：

```bash
npm install -g avc-test-js-mcp
```

然后在配置中使用 `"command": "avc-test-js-mcp"` 配合 `"args": ["--api-key", "your-api-key"]`。

## 开发

```bash
git clone https://github.com/z416479660/avc-test-js-mcp.git
cd js_client
npm install
npm run build
npm run dev
```

## License

MIT License - 详见 [LICENSE](LICENSE) 文件
