#!/usr/bin/env node
/**
 * HTTP MCP Server - 提供视频增强功能的 MCP 服务
 *
 * 通过 MCP 协议暴露 tools，内部调用 FastAPI HTTP Server。
 * 支持 URL 上传和本地文件上传。
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Tool schemas
const CreateTaskSchema = z.object({
  video_source: z.string().describe('视频URL地址或本地文件路径'),
  type: z.enum(['url', 'local']).default('url').describe('上传类型：url=网络视频，local=本地文件'),
  resolution: z.enum(['480p', '540p', '720p', '1080p', '2k']).default('720p').describe('目标分辨率，默认720p'),
});

const GetTaskStatusSchema = z.object({
  task_id: z.string().describe('任务ID'),
});

const EnhanceVideoSyncSchema = z.object({
  video_source: z.string().describe('视频URL地址或本地文件路径'),
  type: z.enum(['url', 'local']).default('url').describe('上传类型：url=网络视频，local=本地文件'),
  resolution: z.enum(['480p', '540p', '720p', '1080p', '2k']).default('720p').describe('目标分辨率，默认720p'),
  poll_interval: z.number().default(5).describe('轮询间隔（秒），默认5'),
  timeout: z.number().default(600).describe('超时时间（秒），默认600'),
});

class VideoEnhancementMCPServer {
  private server: McpServer;
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    // 创建 MCP Server
    this.server = new McpServer(
      {
        name: 'video-enhancement',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 创建 HTTP 客户端
    this.client = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    // 注册 tools
    this.setupTools();
  }

  private setupTools(): void {
    // create_task tool
    this.server.tool(
      'create_task',
      `创建视频增强任务（异步）

支持两种上传方式：
1. URL 上传：提供视频 URL
2. 本地上传：提供本地文件路径，MCP Server 自动读取并转为 base64

参数说明：
- video_source: 视频 URL 或本地文件路径
- type: "url" 或 "local"
- resolution: 目标分辨率`,
      CreateTaskSchema.shape,
      async (args) => {
        try {
          const result = await this.createTask(
            args.video_source,
            args.type,
            args.resolution
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: errorMessage }, null, 2),
              },
            ],
          };
        }
      }
    );

    // get_task_status tool
    this.server.tool(
      'get_task_status',
      '查询视频增强任务状态',
      GetTaskStatusSchema.shape,
      async (args) => {
        try {
          const result = await this.getTaskStatus(args.task_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: errorMessage }, null, 2),
              },
            ],
          };
        }
      }
    );

    // enhance_video_sync tool
    this.server.tool(
      'enhance_video_sync',
      `同步增强视频（阻塞等待完成）

支持两种上传方式：
1. URL 上传：提供视频 URL
2. 本地上传：提供本地文件路径，MCP Server 自动读取并转为 base64

参数说明：
- video_source: 视频 URL 或本地文件路径
- type: "url" 或 "local"
- resolution: 目标分辨率
- poll_interval: 轮询间隔（秒）
- timeout: 超时时间（秒）`,
      EnhanceVideoSyncSchema.shape,
      async (args) => {
        try {
          const result = await this.enhanceVideoSync(
            args.video_source,
            args.type,
            args.resolution,
            args.poll_interval,
            args.timeout
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: errorMessage }, null, 2),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * 读取本地文件并转为 base64
   */
  private readLocalFile(filePath: string): { data: string; fileName: string } {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 检查文件大小（最大 100MB）
    const stats = fs.statSync(filePath);
    const maxSize = 100 * 1024 * 1024;
    if (stats.size > maxSize) {
      throw new Error('文件大小超过 100MB 限制');
    }

    // 读取并编码
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    return {
      data: base64Data,
      fileName: path.basename(filePath),
    };
  }

  private async createTask(
    videoSource: string,
    sourceType: string,
    resolution: string
  ): Promise<any> {
    let contentItem: any;

    if (sourceType === 'local') {
      // 本地上传：读取文件转 base64
      const fileInfo = this.readLocalFile(videoSource);
      contentItem = {
        type: 'video_file',
        file_data: fileInfo.data,
        file_name: fileInfo.fileName,
      };
    } else {
      // URL 上传
      contentItem = {
        type: 'video_url',
        video_url: { url: videoSource },
      };
    }

    const payload = {
      model: 'avc-enhance',
      content: [contentItem],
      resolution,
    };

    const response = await this.client.post('/api/v3/contents/generations/tasks', payload);
    const data = response.data;

    if (data.code !== 0 && data.code !== 200) {
      return { success: false, error: data.message };
    }

    return {
      success: true,
      task_id: data.data.task_id,
      status: data.data.status,
    };
  }

  private async getTaskStatus(taskId: string): Promise<any> {
    const response = await this.client.get(`/api/v3/contents/generations/tasks/${taskId}`);
    const data = response.data;

    if (data.code !== 0 && data.code !== 200) {
      return { success: false, error: data.message };
    }

    const result = data.data;
    return {
      success: true,
      task_id: result.task_id,
      status: result.status,
      progress: result.progress || 0,
      video_url: result.video_url,
      error_message: result.error_message,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  private async enhanceVideoSync(
    videoSource: string,
    sourceType: string,
    resolution: string,
    pollInterval: number,
    timeout: number
  ): Promise<any> {
    // 创建任务
    const createResult = await this.createTask(videoSource, sourceType, resolution);

    if (!createResult.success) {
      return createResult;
    }

    const taskId = createResult.task_id;

    // 轮询等待完成
    const startTime = Date.now();
    while (true) {
      const status = await this.getTaskStatus(taskId);
      if (!status.success) {
        return status;
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= timeout) {
        return {
          success: false,
          error: `任务超时: ${taskId}`,
          task_id: taskId,
        };
      }

      await this.sleep(pollInterval * 1000);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('HTTP MCP Server running on stdio');
  }
}

// 主入口
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let baseUrl = process.env.HTTP_API_BASE_URL || 'https://mcp.luluhero.com';
  let apiKey = process.env.HTTP_API_KEY || '';

  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base-url' && i + 1 < args.length) {
      baseUrl = args[i + 1];
      i++;
    } else if (args[i] === '--api-key' && i + 1 < args.length) {
      apiKey = args[i + 1];
      i++;
    }
  }

  if (!apiKey) {
    console.error('错误: 需要提供 --api-key 或设置 HTTP_API_KEY 环境变量');
    process.exit(1);
  }

  const server = new VideoEnhancementMCPServer(baseUrl, apiKey);
  await server.run();
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
