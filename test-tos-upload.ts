import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

/**
 * 测试脚本：手动测试 TOS 上传流程
 * 用法：npx tsx test-tos-upload.ts <文件路径> [baseUrl] [apiKey]
 *
 * 示例：
 *   npx tsx test-tos-upload.ts D:\video\8.mp4 https://mcp.luluhero.com YOUR_API_KEY
 */

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const baseUrl = (args[1] || 'https://mcp.luluhero.com').replace(/\/$/, '');
  const apiKey = args[2] || process.env.HTTP_API_KEY || '';

  if (!filePath) {
    console.error('用法: npx tsx test-tos-upload.ts <文件路径> [baseUrl] [apiKey]');
    process.exit(1);
  }
  if (!apiKey) {
    console.error('错误: 需要提供 API Key（参数或环境变量 HTTP_API_KEY）');
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`错误: 文件不存在: ${filePath}`);
    process.exit(1);
  }

  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  console.log(`========== 测试 TOS 上传 ==========`);
  console.log(`文件路径: ${filePath}`);
  console.log(`文件名: ${fileName}`);
  console.log(`文件大小: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`API Base: ${baseUrl}`);

  // 步骤 1: 获取 TOS 签名
  console.log(`\n[步骤 1] 获取 TOS 预签名凭证...`);
  let signatureData: any;
  try {
    const client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    const res = await client.post('/api/v3/contents/generations/tos-signature', {
      file_type: 'video',
      file_name: fileName,
    });
    console.log('响应状态:', res.status);
    console.log('响应数据:', JSON.stringify(res.data, null, 2));

    if (res.data.code !== 0 && res.data.code !== 200) {
      console.error('获取签名失败:', res.data.message);
      process.exit(1);
    }
    signatureData = res.data.data;
  } catch (err: any) {
    console.error('获取签名出错:', err.message);
    if (err.response) {
      console.error('错误响应:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }

  // 步骤 2: 解析 file_id
  console.log(`\n[步骤 2] 解析 file_id...`);
  let fileId: string;
  try {
    const pathname = new URL(signatureData.url).pathname;
    const segments = pathname.split('/');
    fileId = segments.pop() || '';
    console.log(`URL: ${signatureData.url}`);
    console.log(`pathname: ${pathname}`);
    console.log(`file_id: ${fileId}`);
  } catch (err: any) {
    console.error('解析 URL 失败:', err.message);
    process.exit(1);
  }

  // 步骤 3: 上传到 TOS
  console.log(`\n[步骤 3] 上传文件到 TOS...`);
  const formData = new FormData();

  console.log('添加签名字段到 FormData:');
  // TOS 要求必须有 key 字段（对象键）
  const objectKey = new URL(signatureData.url).pathname.slice(1);
  console.log(`  key: ${objectKey}`);
  formData.append('key', objectKey);

  // 后端返回的字段名去掉了 x-tos- 前缀，但 TOS policy 里用的是带前缀的，需要映射回来
  const fieldMapping: Record<string, string> = {
    algorithm: 'x-tos-algorithm',
    credential: 'x-tos-credential',
    date: 'x-tos-date',
    signature: 'x-tos-signature',
  };

  for (const [key, value] of Object.entries(signatureData)) {
    if (key === 'url' || key === 'origin_policy') continue;
    const formKey = fieldMapping[key] || key;
    console.log(`  ${formKey}: ${String(value).substring(0, 100)}${String(value).length > 100 ? '...' : ''}`);
    formData.append(formKey, String(value));
  }

  console.log(`  file: ${fileName} (来自 ${filePath})`);
  formData.append('file', fs.createReadStream(filePath), fileName);

  console.log(`\n请求目标 URL: ${signatureData.url}`);
  console.log('FormData 边界 (boundary):', (formData as any)._boundary);

  console.log('\n开始上传 (使用 axios)...');
  let uploadRes: any;
  try {
    uploadRes = await axios.post(signatureData.url, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  } catch (err: any) {
    console.error('上传请求异常:', err.message);
    if (err.response) {
      console.error('错误状态:', err.response.status);
      console.error('错误响应体:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }

  console.log(`\n上传响应状态: ${uploadRes.status}`);

  if (uploadRes.status >= 400) {
    console.error('\n❌ TOS 上传失败!');
    console.error('响应体:', uploadRes.data);
    process.exit(1);
  }

  console.log('\n✅ TOS 上传成功!');
  console.log(`file_id: ${fileId}`);

  // 步骤 4: 创建任务（可选）
  console.log(`\n[步骤 4] 创建增强任务...`);
  try {
    const client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    const taskRes = await client.post('/api/v3/contents/generations/tasks', {
      model: 'avc-enhance',
      content: [
        {
          type: 'video_file',
          file_id: fileId,
          file_name: fileName,
        },
      ],
      resolution: '1080p',
    });
    console.log('创建任务响应:', JSON.stringify(taskRes.data, null, 2));
  } catch (err: any) {
    console.error('创建任务失败:', err.message);
    if (err.response) {
      console.error('错误响应:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

main().catch(console.error);
