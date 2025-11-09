# Tripo3D FastAPI 接口文档

## 📋 目录

- [服务概述](#服务概述)
- [基础信息](#基础信息)
- [认证方式](#认证方式)
- [API 接口](#api-接口)
  - [1. 健康检查](#1-健康检查)
  - [2. 服务信息](#2-服务信息)
  - [3. 图像上传生成3D](#3-图像上传生成3d)
  - [4. URL图像生成3D](#4-url图像生成3d)
  - [5. 查询任务状态](#5-查询任务状态)
  - [6. 下载3D模型](#6-下载3d模型)
- [数据模型](#数据模型)
- [错误码](#错误码)
- [使用示例](#使用示例)

---

## 服务概述

Tripo3D FastAPI 服务提供图像转3D模型的能力，支持图像上传和URL方式，可查询任务进度并下载生成的3D模型。

**核心功能**：
- ✅ 本地图像文件上传
- ✅ 远程图像URL转换
- ✅ 任务状态实时查询
- ✅ 3D模型下载（GLB格式）
- ✅ 支持自定义面数、纹理等参数

---

## 基础信息

| 项目 | 内容 |
|------|------|
| **服务地址** | `http://0.0.0.0:8002` |
| **API 文档** | `http://0.0.0.0:8002/docs` (Swagger UI) |
| **ReDoc 文档** | `http://0.0.0.0:8002/redoc` |
| **健康检查** | `http://0.0.0.0:8002/health` |
| **API 版本** | v1.0.0 |
| **协议** | HTTP/HTTPS |

---

## 认证方式

**无需认证** - 本服务作为中间层，已配置 Tripo3D API Key，客户端无需提供认证信息。

> ⚠️ 注意：生产环境建议添加 API Key 或 JWT 认证机制。

---

## API 接口

### 1. 健康检查

检查服务运行状态和配置信息。

#### 请求

```http
GET /health
```

#### 响应示例

```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T10:15:48.123456",
  "api_key_configured": true,
  "base_url": "https://api.tripo3d.ai/v2/openapi",
  "warning": null
}
```

#### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 服务状态（healthy/unhealthy） |
| timestamp | string | 时间戳（ISO 8601格式） |
| api_key_configured | boolean | API Key 是否已配置 |
| base_url | string | Tripo3D API 基础URL |
| warning | string/null | 警告信息（如未配置API Key） |

---

### 2. 服务信息

获取 API 服务的基本信息和可用端点。

#### 请求

```http
GET /
```

#### 响应示例

```json
{
  "service": "Tripo3D API Service",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs",
  "redoc": "/redoc",
  "endpoints": {
    "upload": "POST /api/v1/image-to-3d",
    "url": "POST /api/v1/image-to-3d/url",
    "status": "GET /api/v1/task/{task_id}",
    "download": "GET /api/v1/download/{task_id}",
    "health": "GET /health"
  }
}
```

---

### 3. 图像上传生成3D

上传本地图像文件，生成3D模型。

#### 请求

```http
POST /api/v1/image-to-3d
Content-Type: multipart/form-data
```

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| file | File | ✅ | - | 图像文件（PNG/JPG/JPEG，最大10MB） |
| model_type | string | ❌ | default | 模型类型（default/cartoon/realistic） |
| texture | boolean | ❌ | true | 是否生成纹理 |
| face_limit | integer | ❌ | 10000 | 面数限制（5000-100000） |

#### cURL 示例

```bash
curl -X POST "http://localhost:8002/api/v1/image-to-3d" \
  -F "file=@/path/to/image.png" \
  -F "model_type=realistic" \
  -F "texture=true" \
  -F "face_limit=20000"
```

#### Python 示例

```python
import requests

url = "http://localhost:8002/api/v1/image-to-3d"

files = {
    'file': ('image.png', open('image.png', 'rb'), 'image/png')
}

data = {
    'model_type': 'realistic',
    'texture': True,
    'face_limit': 20000
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

#### 响应示例（成功）

```json
{
  "task_id": "94b9e2d7-e19f-4e18-8e02-87fc8afe1401",
  "status": "queued",
  "message": "任务已创建，正在排队处理"
}
```

#### 响应示例（错误）

```json
{
  "detail": "文件大小不能超过10MB"
}
```

---

### 4. URL图像生成3D

通过图像URL生成3D模型。

#### 请求

```http
POST /api/v1/image-to-3d/url
Content-Type: application/json
```

#### 请求体

```json
{
  "image_url": "https://example.com/image.png",
  "model_type": "realistic",
  "texture": true,
  "face_limit": 20000
}
```

#### 请求字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| image_url | string | ✅ | - | 图像URL（必须可公开访问） |
| model_type | string | ❌ | default | 模型类型 |
| texture | boolean | ❌ | true | 是否生成纹理 |
| face_limit | integer | ❌ | 10000 | 面数限制 |

#### cURL 示例

```bash
curl -X POST "http://localhost:8002/api/v1/image-to-3d/url" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.png",
    "model_type": "realistic",
    "texture": true,
    "face_limit": 20000
  }'
```

#### JavaScript 示例

```javascript
const response = await fetch('http://localhost:8002/api/v1/image-to-3d/url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://example.com/image.png',
    model_type: 'realistic',
    texture: true,
    face_limit: 20000
  })
});

const data = await response.json();
console.log(data);
```

#### 响应示例

```json
{
  "task_id": "94b9e2d7-e19f-4e18-8e02-87fc8afe1401",
  "status": "queued",
  "message": "任务已创建，正在排队处理"
}
```

---

### 5. 查询任务状态

查询3D生成任务的当前状态和进度。

#### 请求

```http
GET /api/v1/task/{task_id}
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | ✅ | 任务ID（由创建接口返回） |

#### cURL 示例

```bash
curl "http://localhost:8002/api/v1/task/94b9e2d7-e19f-4e18-8e02-87fc8afe1401"
```

#### 响应示例（进行中）

```json
{
  "task_id": "94b9e2d7-e19f-4e18-8e02-87fc8afe1401",
  "status": "running",
  "progress": 45,
  "model_url": null,
  "preview_url": null,
  "error_message": null
}
```

#### 响应示例（已完成）

```json
{
  "task_id": "94b9e2d7-e19f-4e18-8e02-87fc8afe1401",
  "status": "success",
  "progress": 100,
  "model_url": "https://cdn.tripo3d.ai/models/abc123.glb",
  "preview_url": "https://cdn.tripo3d.ai/previews/abc123.png",
  "error_message": null
}
```

#### 响应示例（失败）

```json
{
  "task_id": "94b9e2d7-e19f-4e18-8e02-87fc8afe1401",
  "status": "failed",
  "progress": 0,
  "model_url": null,
  "preview_url": null,
  "error_message": "图像质量不足，无法生成3D模型"
}
```

#### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务ID |
| status | string | 任务状态（queued/running/success/failed） |
| progress | integer | 进度百分比（0-100） |
| model_url | string/null | 模型下载URL（完成后可用） |
| preview_url | string/null | 预览图URL |
| error_message | string/null | 错误信息（失败时） |

---

### 6. 下载3D模型

下载生成的3D模型文件（GLB格式）。

#### 请求

```http
GET /api/v1/download/{task_id}
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | ✅ | 任务ID |

#### cURL 示例

```bash
# 下载并保存为文件
curl "http://localhost:8002/api/v1/download/94b9e2d7-e19f-4e18-8e02-87fc8afe1401" \
  -o model.glb
```

#### wget 示例

```bash
wget "http://localhost:8002/api/v1/download/94b9e2d7-e19f-4e18-8e02-87fc8afe1401" \
  -O model.glb
```

#### Python 示例

```python
import requests

task_id = "94b9e2d7-e19f-4e18-8e02-87fc8afe1401"
url = f"http://localhost:8002/api/v1/download/{task_id}"

response = requests.get(url)

if response.status_code == 200:
    with open("model.glb", "wb") as f:
        f.write(response.content)
    print("模型下载成功！")
else:
    print(f"下载失败: {response.text}")
```

#### 响应

- **成功**: 返回 GLB 文件二进制数据
- **失败**: 返回 JSON 错误信息

```json
{
  "detail": "任务尚未完成，当前状态: running"
}
```

---

## 数据模型

### ModelType（模型类型）

| 值 | 说明 |
|----|------|
| default | 默认模型（平衡质量和速度） |
| cartoon | 卡通风格模型 |
| realistic | 写实风格模型（更高质量，耗时更长） |

### TaskStatus（任务状态）

| 值 | 说明 |
|----|------|
| queued | 排队中 |
| running | 处理中 |
| success | 成功完成 |
| failed | 失败 |

---

## 错误码

| HTTP 状态码 | 说明 | 示例 |
|------------|------|------|
| 200 | 成功 | 任务创建成功 |
| 400 | 请求参数错误 | 文件格式不支持、参数超出范围 |
| 401 | 未授权 | API Key 无效 |
| 403 | 禁止访问 | 账户余额不足 |
| 404 | 资源不存在 | 任务ID不存在 |
| 500 | 服务器内部错误 | 网络连接失败、第三方API异常 |

---

## 使用示例

### 完整工作流程示例

#### 1. Python 完整示例

```python
import requests
import time

BASE_URL = "http://localhost:8002"

# 步骤1: 上传图像并创建任务
print("📤 上传图像...")
with open("test_image.png", "rb") as f:
    files = {'file': ('test.png', f, 'image/png')}
    data = {
        'model_type': 'realistic',
        'texture': True,
        'face_limit': 20000
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/image-to-3d",
        files=files,
        data=data
    )
    
    result = response.json()
    task_id = result['task_id']
    print(f"✅ 任务创建成功: {task_id}")

# 步骤2: 轮询任务状态
print("📊 等待任务完成...")
while True:
    response = requests.get(f"{BASE_URL}/api/v1/task/{task_id}")
    status_data = response.json()
    
    status = status_data['status']
    progress = status_data['progress']
    
    print(f"当前状态: {status}, 进度: {progress}%")
    
    if status == 'success':
        model_url = status_data['model_url']
        print(f"✅ 任务完成！模型URL: {model_url}")
        break
    elif status == 'failed':
        error = status_data['error_message']
        print(f"❌ 任务失败: {error}")
        break
    
    time.sleep(5)  # 每5秒查询一次

# 步骤3: 下载模型
print("📥 下载模型...")
response = requests.get(f"{BASE_URL}/api/v1/download/{task_id}")

if response.status_code == 200:
    with open("model.glb", "wb") as f:
        f.write(response.content)
    print("✅ 模型下载成功: model.glb")
else:
    print(f"❌ 下载失败: {response.text}")
```

#### 2. Node.js 完整示例

```javascript
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:8002';

async function createTask() {
  // 步骤1: 上传图像
  console.log('📤 上传图像...');
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream('test_image.png'));
  formData.append('model_type', 'realistic');
  formData.append('texture', true);
  formData.append('face_limit', 20000);
  
  const response = await axios.post(
    `${BASE_URL}/api/v1/image-to-3d`,
    formData,
    { headers: formData.getHeaders() }
  );
  
  const taskId = response.data.task_id;
  console.log(`✅ 任务创建成功: ${taskId}`);
  
  return taskId;
}

async function waitForCompletion(taskId) {
  // 步骤2: 等待完成
  console.log('📊 等待任务完成...');
  
  while (true) {
    const response = await axios.get(
      `${BASE_URL}/api/v1/task/${taskId}`
    );
    
    const { status, progress } = response.data;
    console.log(`当前状态: ${status}, 进度: ${progress}%`);
    
    if (status === 'success') {
      console.log('✅ 任务完成！');
      return response.data;
    } else if (status === 'failed') {
      throw new Error(`任务失败: ${response.data.error_message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function downloadModel(taskId) {
  // 步骤3: 下载模型
  console.log('📥 下载模型...');
  
  const response = await axios.get(
    `${BASE_URL}/api/v1/download/${taskId}`,
    { responseType: 'arraybuffer' }
  );
  
  fs.writeFileSync('model.glb', response.data);
  console.log('✅ 模型下载成功: model.glb');
}

// 执行完整流程
(async () => {
  try {
    const taskId = await createTask();
    await waitForCompletion(taskId);
    await downloadModel(taskId);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
})();
```

#### 3. Shell 脚本示例

```bash
#!/bin/bash

BASE_URL="http://localhost:8002"

# 步骤1: 上传图像
echo "📤 上传图像..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/image-to-3d" \
  -F "file=@test_image.png" \
  -F "model_type=realistic" \
  -F "texture=true" \
  -F "face_limit=20000")

TASK_ID=$(echo $RESPONSE | jq -r '.task_id')
echo "✅ 任务创建成功: $TASK_ID"

# 步骤2: 轮询任务状态
echo "📊 等待任务完成..."
while true; do
  STATUS_RESPONSE=$(curl -s "$BASE_URL/api/v1/task/$TASK_ID")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  PROGRESS=$(echo $STATUS_RESPONSE | jq -r '.progress')
  
  echo "当前状态: $STATUS, 进度: $PROGRESS%"
  
  if [ "$STATUS" = "success" ]; then
    echo "✅ 任务完成！"
    break
  elif [ "$STATUS" = "failed" ]; then
    ERROR=$(echo $STATUS_RESPONSE | jq -r '.error_message')
    echo "❌ 任务失败: $ERROR"
    exit 1
  fi
  
  sleep 5
done

# 步骤3: 下载模型
echo "📥 下载模型..."
curl -o model.glb "$BASE_URL/api/v1/download/$TASK_ID"
echo "✅ 模型下载成功: model.glb"
```

---

## 注意事项

### ⚠️ 限制说明

1. **文件大小**: 单个图像文件最大 10MB
2. **支持格式**: PNG, JPG, JPEG
3. **面数范围**: 5,000 - 100,000
4. **超时时间**: 上传30秒，状态查询30秒，下载300秒
5. **账户余额**: 需要确保 Tripo3D 账户有足够的积分

### 💡 最佳实践

1. **轮询间隔**: 建议每 5-10 秒查询一次任务状态
2. **错误重试**: 网络错误时建议重试 3 次
3. **图像质量**: 建议使用清晰、背景简单的图像
4. **超时处理**: 复杂模型可能需要 2-5 分钟生成

### 🔒 安全建议

1. 生产环境应添加认证机制
2. 限制请求频率（Rate Limiting）
3. 添加 CORS 域名白名单
4. 记录审计日志

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2025-11-09 | 初始版本，支持基本的图生3D功能 |

---

## 技术支持

- **API 文档**: http://localhost:8002/docs
- **GitHub**: [项目地址]
- **问题反馈**: [Issues 页面]

---

**文档生成时间**: 2025-11-09  
**最后更新**: 2025-11-09