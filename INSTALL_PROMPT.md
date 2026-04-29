# 一键安装 Prompt

将以下内容直接复制发送给你的 AI 助手（Claude、ChatGPT、Cursor 等），它会自动帮你完成安装配置。

---

## Prompt 内容

```
请帮我在我的 MCP 客户端中安装并配置 video-enhancement MCP 服务。

## 服务信息

- npm 包名：avc-test-js-mcp@latest
- 运行方式：npx -y avc-test-js-mcp@latest
- 传输方式：stdio
- 所需环境变量：HTTP_API_KEY（必填）
- 可选环境变量：HTTP_API_BASE_URL（默认 https://mcp.luluhero.com）

## 我的 API Key

请将我下面提供的 API Key 填入配置中：
[在此粘贴你的 API Key]

## 请帮我完成以下操作

1. 检测我当前使用的 MCP 客户端（Claude Desktop、Cursor、Cline 或其他）
2. 找到对应的配置文件路径
3. 生成正确的配置并写入文件
4. 如果是 Claude Desktop 或 Cursor，提示我需要重启客户端
5. 告诉我如何验证安装是否成功

## 不同客户端的配置参考

### Claude Desktop
配置文件路径：
- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
- Windows: %APPDATA%\Claude\claude_desktop_config.json

配置示例：
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

### Cursor
编辑 ~/.cursor/mcp.json：
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

### Cline (VS Code)
在 Cline MCP Servers 设置中添加：
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

## 功能说明

安装成功后，我会拥有以下工具：
- create_task：创建视频增强任务（支持 URL 或本地文件上传）
- get_task_status：查询任务状态
- enhance_video_sync：同步增强视频（阻塞等待完成）

支持分辨率：480p、540p、720p、1080p、2k

## 验证方式

配置完成后：
1. 重启 MCP 客户端
2. 在 Claude Desktop 中查看输入框右下角是否有锤子图标
3. 或询问 AI："你有哪些可用的工具？"
4. 应看到 create_task、get_task_status、enhance_video_sync
```

---

## 使用方式

1. 复制上面的 **Prompt 内容**（包括代码块）
2. 将 `[在此粘贴你的 API Key]` 替换为你的真实 API Key
3. 发送给你的 AI 助手
4. AI 会自动检测你的客户端并完成配置

## 进阶：自定义 Prompt

如果你需要更具体的指令，可以在 Prompt 中补充：

```
我的操作系统是 [macOS/Windows/Linux]
我使用的 MCP 客户端是 [Claude Desktop/Cursor/Cline/其他]
我的 API Key 是：sk-xxxxxxxx
```
