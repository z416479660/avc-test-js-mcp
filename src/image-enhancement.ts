import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import FormData from 'form-data';

// Schemas
const EnhanceImageSyncSchema = z.object({
  image_source: z.string().describe('Image URL or local file path (URL must be publicly accessible, login or signed links are not supported)'),
  type: z.enum(['url', 'local']).default('url').describe('Upload type: url=remote image, local=local file'),
  scale: z.number().default(2).describe('Enhancement scale multiplier, default 2. Controls the upscaling factor for image enhancement (e.g. 2=2x, 4=4x)'),
  poll_interval: z.number().default(5).describe('Polling interval in seconds, default 5'),
  timeout: z.number().default(50).describe('Synchronous wait timeout in seconds, default 50. Returns task_id early when exceeded, use get_image_task_status to continue polling'),
});

const ColorizeImageSyncSchema = z.object({
  image_source: z.string().describe('Image URL or local file path (URL must be publicly accessible, login or signed links are not supported)'),
  type: z.enum(['url', 'local']).default('url').describe('Upload type: url=remote image, local=local file'),
  poll_interval: z.number().default(5).describe('Polling interval in seconds, default 5'),
  timeout: z.number().default(50).describe('Synchronous wait timeout in seconds, default 50. Returns task_id early when exceeded, use get_image_task_status to continue polling'),
});

const DenoiseImageSyncSchema = z.object({
  image_source: z.string().describe('Image URL or local file path (URL must be publicly accessible, login or signed links are not supported)'),
  type: z.enum(['url', 'local']).default('url').describe('Upload type: url=remote image, local=local file'),
  poll_interval: z.number().default(5).describe('Polling interval in seconds, default 5'),
  timeout: z.number().default(50).describe('Synchronous wait timeout in seconds, default 50. Returns task_id early when exceeded, use get_image_task_status to continue polling'),
});

// Schema - status query
const GetImageTaskStatusSchema = z.object({
  task_id: z.string().describe('Task ID'),
});

export function setupImageEnhancementTools(server: McpServer, baseUrl: string, apiKey: string): void {
  const client: AxiosInstance = axios.create({
    baseURL: baseUrl.replace(/\/$/, ''),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
  });

  // ========== Sync task tools ==========

  // enhance_image_sync tool
  server.tool(
    'enhance_image_sync',
    `Synchronously enhance an image to improve quality and optimize faces.

Two upload methods are supported:
1. URL upload: provide an image URL
2. Local upload: provide a local file path, the MCP Server will auto-upload to TOS object storage

Best for images with estimated processing time < 1 minute. If the task is not completed within 50 seconds, the tool returns early with a task_id. Use get_image_task_status to continue polling.`,
    EnhanceImageSyncSchema.shape,
    async (args) => {
      try {
        const result = await processImageSync(client, args.image_source, args.type, 'enhance', args.poll_interval, args.timeout, args.scale);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
        };
      }
    }
  );

  // colorize_image_sync tool
  server.tool(
    'colorize_image_sync',
    `Synchronously colorize a black-and-white photo.

Two upload methods are supported:
1. URL upload: provide an image URL
2. Local upload: provide a local file path, the MCP Server will auto-upload to TOS object storage

Best for images with estimated processing time < 1 minute. If the task is not completed within 50 seconds, the tool returns early with a task_id. Use get_image_task_status to continue polling.`,
    ColorizeImageSyncSchema.shape,
    async (args) => {
      try {
        const result = await processImageSync(client, args.image_source, args.type, 'colorize', args.poll_interval, args.timeout);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
        };
      }
    }
  );

  // denoise_image_sync tool
  server.tool(
    'denoise_image_sync',
    `Synchronously remove noise from an image.

Two upload methods are supported:
1. URL upload: provide an image URL
2. Local upload: provide a local file path, the MCP Server will auto-upload to TOS object storage

Best for images with estimated processing time < 1 minute. If the task is not completed within 50 seconds, the tool returns early with a task_id. Use get_image_task_status to continue polling.`,
    DenoiseImageSyncSchema.shape,
    async (args) => {
      try {
        const result = await processImageSync(client, args.image_source, args.type, 'denoise', args.poll_interval, args.timeout);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
        };
      }
    }
  );

  // ========== Status query tool ==========

  // get_image_task_status tool
  server.tool(
    'get_image_task_status',
    'Query image processing task status. The status field can be: processing, completed, or failed. If status is processing, wait a few seconds and call this tool again to poll.',
    GetImageTaskStatusSchema.shape,
    async (args) => {
      try {
        const result = await getImageTaskStatus(client, args.task_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
        };
      }
    }
  );
}

function checkLocalFile(filePath: string): { filePath: string; fileName: string } {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  const stats = fs.statSync(filePath);
  const maxSize = 100 * 1024 * 1024;
  if (stats.size > maxSize) {
    throw new Error('File size exceeds 100MB limit');
  }
  return { filePath, fileName: path.basename(filePath) };
}

async function getImageTosSignature(client: AxiosInstance, fileName: string): Promise<any> {
  const response = await client.post('/api/v3/contents/generations/tos-signature', {
    file_type: 'image',
    file_name: fileName,
  });
  const data = response.data;
  if (data.code !== 0 && data.code !== 200) {
    throw new Error(data.message || 'Failed to get TOS signature');
  }
  return data.data;
}

async function uploadToTos(filePath: string, signatureData: any): Promise<void> {
  const formData = new FormData();
  const objectKey = decodeURIComponent(new URL(signatureData.url).pathname.slice(1));
  formData.append('key', objectKey);

  const fieldMapping: Record<string, string> = {
    algorithm: 'x-tos-algorithm',
    credential: 'x-tos-credential',
    date: 'x-tos-date',
    signature: 'x-tos-signature',
  };

  for (const [key, value] of Object.entries(signatureData)) {
    if (key === 'url' || key === 'origin_policy') continue;
    const formKey = fieldMapping[key] || key;
    formData.append(formKey, String(value));
  }

  const fileName = path.basename(filePath);
  formData.append('file', fs.createReadStream(filePath), fileName);

  const response = await axios.post(signatureData.url, formData, {
    headers: formData.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (response.status >= 400) {
    const debugInfo = JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      url: signatureData.url,
      signatureFields: Object.keys(signatureData),
      fileName,
      fileSize: fs.statSync(filePath).size,
    }, null, 2);
    throw new Error(`TOS upload failed: ${response.status} ${response.statusText}\nDebug info: ${debugInfo}`);
  }
}

function parseFileIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/');
  return decodeURIComponent(segments.pop() || '');
}

function getEndpointByTaskType(taskType: string): string {
  switch (taskType) {
    case 'enhance':
      return '/api/v3/contents/generations/image/enhance';
    case 'colorize':
      return '/api/v3/contents/generations/image/colorize';
    case 'denoise':
      return '/api/v3/contents/generations/image/denoise';
    default:
      throw new Error(`Unknown task_type: ${taskType}`);
  }
}

async function createImageTask(
  client: AxiosInstance,
  imageSource: string,
  sourceType: string,
  taskType: string,
  scale?: number
): Promise<any> {
  let contentItem: any;

  if (sourceType === 'local') {
    const fileInfo = checkLocalFile(imageSource);
    const signatureData = await getImageTosSignature(client, fileInfo.fileName);
    await uploadToTos(imageSource, signatureData);
    const fileId = parseFileIdFromUrl(signatureData.url);
    contentItem = { type: 'image_file', file_id: fileId, file_name: fileInfo.fileName };
  } else {
    contentItem = { type: 'image_url', image_url: { url: imageSource } };
  }

  const endpoint = getEndpointByTaskType(taskType);
  const payload: any = { model: 'avc-enhance', content: [contentItem] };
  if (scale !== undefined) {
    payload.scale = scale;
  }
  const response = await client.post(endpoint, payload);
  const data = response.data;

  if (data.code !== 0 && data.code !== 200) {
    return { success: false, error: data.message };
  }
  return { success: true, task_id: data.data.task_id, status: data.data.status };
}

async function getImageTaskStatus(client: AxiosInstance, taskId: string): Promise<any> {
  const response = await client.get(`/api/v3/contents/generations/tasks/${taskId}`);
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
    image_url: result.image_url,
    video_url: result.video_url,
    debug_image_url_length: result.image_url?.length,
    debug_image_url_full: result.image_url,
    error_message: result.error_message,
    created_at: result.created_at,
    updated_at: result.updated_at,
    message: result.status === 'processing' ? 'Task is still processing, please check again later' : undefined,
  };
}

async function processImageSync(
  client: AxiosInstance,
  imageSource: string,
  sourceType: string,
  taskType: string,
  pollInterval: number,
  timeout: number,
  scale?: number
): Promise<any> {
  const createResult = await createImageTask(client, imageSource, sourceType, taskType, scale);
  if (!createResult.success) {
    return createResult;
  }

  const taskId = createResult.task_id;
  const startTime = Date.now();
  while (true) {
    const status = await getImageTaskStatus(client, taskId);
    if (!status.success) {
      return status;
    }
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= timeout) {
      return {
        success: true,
        status: 'processing',
        task_id: taskId,
        message: `Task is still processing (waited ${timeout} seconds). Please use get_image_task_status to continue polling.`,
        note: 'The synchronous wait for this long-running task has been truncated. Switch to get_image_task_status polling.',
      };
    }
    await sleep(pollInterval * 1000);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
