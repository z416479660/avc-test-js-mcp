# 一键安装 Prompt

## 方案一：Claude Code（CLI）

Claude Code 的 MCP 配置文件位置不固定，**不要假设路径**。请复制下面的完整提示词发给 Claude Code：

````
请帮我安装 MCP server `avc-test-js-mcp`。

我的 API Key 是：`sk-xxxxxxxx`

**重要：请按以下步骤操作，不要假设配置文件位置：**

1. 先运行 `/mcp` 命令，查看输出中 "User MCPs" 后面显示的是哪个配置文件路径
2. 读取那个文件，确认格式
3. 把新 server 配置写入同一个文件
4. 写入后运行 `/mcp` 验证是否成功加载

如果 `/mcp` 命令不可用，请读取以下可能的配置文件，按优先级检查：
- Windows: `%USERPROFILE%\.claude.json`
- macOS: `~/.claude.json`
- Linux: `~/.claude.json`
- 或者: `~/.claude/mcp.json`（旧版/备用）

要写入的配置内容：
```json
{
  "mcpServers": {
    "video-enhancement": {
      "command": "npx",
      "args": ["-y", "avc-test-js-mcp@latest"],
      "env": {
        "HTTP_API_KEY": "sk-xxxxxxxx"
      }
    }
  }
}
```
````

---

## 方案二：Cursor / Cline / 其他 AI Agent

如果你使用的 AI Agent 有确定的 MCP 配置路径（如 Cursor、Cline），直接复制下面这句发给 AI：

```
帮我安装 npm 包 avc-test-js-mcp 作为 MCP server。我的 API Key 是：sk-xxxxxxxx。
```

AI 会自动完成：
1. 检测你使用的 MCP 客户端（Claude Desktop / Cursor / Cline）
2. 找到配置文件路径
3. 写入正确的配置
4. 提示你重启客户端

---

## 方案三：发给 Claude Desktop / 无工具 AI

如果你的 AI **不能**直接操作文件，复制下面的完整指令：

```
请帮我在 MCP 客户端中配置 video-enhancement 服务。

npm 包信息：
- 包名：avc-test-js-mcp@latest
- 运行命令：npx -y avc-test-js-mcp@latest
- 所需环境变量：HTTP_API_KEY（必填）、HTTP_API_BASE_URL（可选，默认 https://mcp.luluhero.com）
- 运行要求：Node.js >= 18

我的 API Key：sk-xxxxxxxx

请根据我的操作系统和 MCP 客户端，生成正确的配置文件内容，并告诉我：
1. 配置文件路径
2. 需要写入的 JSON 内容
3. 是否需要重启客户端
```

AI 会返回可直接复制粘贴的配置，你手动写入即可。

---

## 方案三：复制粘贴配置（最快）

不想和 AI 对话？直接复制对应客户端的配置：

### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "video-enhancement": {
      "command": "npx",
      "args": ["-y", "avc-test-js-mcp@latest"],
      "env": {
        "HTTP_API_KEY": "sk-xxxxxxxx"
      }
    }
  }
}
```

### Cursor

编辑 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "video-enhancement": {
      "command": "npx",
      "args": ["-y", "avc-test-js-mcp@latest"],
      "env": {
        "HTTP_API_KEY": "sk-xxxxxxxx"
      }
    }
  }
}
```

### Cline (VS Code)

在 Cline MCP Servers 设置中添加：

```json
{
  "mcpServers": [
    {
      "name": "video-enhancement",
      "command": "npx",
      "args": ["-y", "avc-test-js-mcp@latest"],
      "env": {
        "HTTP_API_KEY": "sk-xxxxxxxx"
      }
    }
  ]
}
```

**记得将 `sk-xxxxxxxx` 替换为你的真实 API Key。**

---

## 验证安装

配置完成后，重启 MCP 客户端，然后问 AI：

> "你有哪些可用的工具？"

如果看到 `create_task`、`get_task_status`、`enhance_video_sync`，说明安装成功。
