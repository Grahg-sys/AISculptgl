"""
Tripo3D FastAPI 服务
图像生成3D模型的API服务

安装依赖:
pip install fastapi uvicorn httpx pydantic python-multipart pydantic-settings python-dotenv

运行服务:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

环境变量配置:
在 .env 文件中配置:
TRIPO3D_API_KEY=sk-apikey
TRIPO3D_BASE_URL=https://api.tripo3d.ai/v2/openapi
"""

import os
import httpx
import asyncio
import json
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum
import base64
from datetime import datetime
import tempfile
import shutil

# ==================== 配置加载 ====================
# 👉 简化版：直接使用环境变量
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 配置变量
TRIPO3D_API_KEY = os.getenv("TRIPO3D_API_KEY", "sk-apikey")
TRIPO3D_BASE_URL = os.getenv("TRIPO3D_BASE_URL", "https://api.tripo3d.ai/v2/openapi")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8002"))
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# 创建临时目录
Path("./temp").mkdir(exist_ok=True)

# ==================== FastAPI 应用初始化 ====================
app = FastAPI(
    title="Tripo3D API Service",
    description="图像生成3D模型服务 - 支持图像上传、URL转换、任务管理",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 数据模型 ====================
class ModelType(str, Enum):
    """模型类型"""
    DEFAULT = "default"
    CARTOON = "cartoon"
    REALISTIC = "realistic"

class TaskStatus(str, Enum):
    """任务状态"""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

class ImageTo3DRequest(BaseModel):
    """图像转3D请求"""
    model_config = {"protected_namespaces": ()}

    image_url: Optional[str] = Field(None, description="图像URL（与file二选一）")
    model_type: ModelType = Field(ModelType.DEFAULT, description="模型类型")
    texture: bool = Field(True, description="是否生成纹理")
    face_limit: int = Field(10000, description="面数限制(5000-100000)", ge=5000, le=100000)

class TaskResponse(BaseModel):
    """任务响应"""
    task_id: str
    status: str
    message: str

class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    model_config = {"protected_namespaces": ()}

    task_id: str
    status: TaskStatus
    progress: int
    model_url: Optional[str] = None
    preview_url: Optional[str] = None
    error_message: Optional[str] = None

# ==================== Tripo3D 客户端 ====================
class Tripo3DClient:
    """Tripo3D API客户端"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = TRIPO3D_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def upload_image(self, image_data: bytes) -> str:
        """上传图像到Tripo3D并直接创建任务"""
        print(f"🚀 上传图像到 Tripo3D...")
        print(f"📋 图像大小: {len(image_data)} bytes")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # 将图像转为base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Tripo3D API v2 - 直接创建任务
            # 参考: https://platform.tripo3d.ai/docs
            payload = {
                "type": "image_to_model",
                "file": {
                    "type": "png",  # 或 "jpeg"
                    "data": image_base64
                }
            }
            
            print(f"📤 发送请求到: {self.base_url}/task")
            
            try:
                response = await client.post(
                    f"{self.base_url}/task",
                    headers=self.headers,
                    json=payload
                )
                
                print(f"📡 响应状态码: {response.status_code}")
                print(f"📡 响应内容: {response.text[:500]}")
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    print(f"✅ 任务创建成功!")
                    
                    # 提取 task_id
                    if "data" in result:
                        if "task_id" in result["data"]:
                            return result["data"]["task_id"]
                        elif "id" in result["data"]:
                            return result["data"]["id"]
                    
                    # 如果在根级别
                    if "task_id" in result:
                        return result["task_id"]
                    elif "id" in result:
                        return result["id"]
                    
                    print(f"⚠️ 无法找到 task_id，完整响应: {json.dumps(result, indent=2)}")
                    raise HTTPException(
                        status_code=500,
                        detail="无法从响应中提取任务ID"
                    )
                else:
                    error_detail = response.text
                    print(f"❌ 上传失败: {error_detail}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"图像上传失败: {error_detail}"
                    )
                    
            except httpx.HTTPError as e:
                print(f"❌ HTTP错误: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"网络请求失败: {str(e)}"
                )
    
    async def create_task(
        self,
        image_token: str,
        model_type: str = "default",
        texture: bool = True,
        face_limit: int = 10000
    ) -> dict:
        """
        创建3D生成任务
        注意: upload_image 已经创建了任务，所以这里只是返回信息
        """
        print(f"📊 任务已创建: {image_token}")
        
        return {
            "task_id": image_token,
            "status": "queued",
            "message": "任务已提交"
        }
    
    async def get_task_status(self, task_id: str) -> dict:
        """获取任务状态"""
        print(f"📊 查询任务状态: {task_id}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/task/{task_id}",
                    headers=self.headers
                )
                
                print(f"📡 状态查询响应: {response.status_code}")
                print(f"📡 响应内容: {response.text[:500]}")
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # 提取数据
                    data = result.get("data", result)
                    
                    return {
                        "status": data.get("status", "unknown"),
                        "progress": data.get("progress", 0),
                        "output": data.get("output", {}),
                        "model_url": data.get("output", {}).get("pbr_model") or data.get("output", {}).get("model"),
                        "preview_url": data.get("output", {}).get("preview"),
                        "error_message": data.get("error")
                    }
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"获取任务状态失败: {response.text}"
                    )
                    
            except httpx.HTTPError as e:
                print(f"❌ 查询失败: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"查询任务状态失败: {str(e)}"
                )
    
    async def download_model(self, model_url: str, save_path: str):
        """下载3D模型"""
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                print(f"📥 开始下载模型: {model_url}")
                response = await client.get(model_url)
                
                if response.status_code != 200:
                    print(f"❌ 模型下载失败，状态码: {response.status_code}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"模型下载失败，状态码: {response.status_code}"
                    )
                
                print(f"📊 模型大小: {len(response.content)} bytes")
                
                with open(save_path, 'wb') as f:
                    f.write(response.content)
                
                print(f"✅ 模型已保存到: {save_path}")
                
        except Exception as e:
            print(f"❌ 下载模型异常: {e}")
            raise

# 初始化客户端
tripo_client = Tripo3DClient(TRIPO3D_API_KEY)

# 临时文件清理函数
def cleanup_temp_file(file_path: str):
    """清理临时文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️  已清理临时文件: {file_path}")
    except Exception as e:
        print(f"⚠️  清理临时文件失败: {e}")

# 确保temp目录存在
temp_dir = "./temp"
os.makedirs(temp_dir, exist_ok=True)
print(f"📁 临时目录已准备: {temp_dir}")

# ==================== API 路由 ====================

@app.get("/", tags=["根路径"])
async def root():
    """API信息"""
    return {
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

@app.post("/api/v1/image-to-3d", response_model=TaskResponse, tags=["3D生成"])
async def image_to_3d(
    file: UploadFile = File(...),
    model_type: ModelType = ModelType.DEFAULT,
    texture: bool = True,
    face_limit: int = 10000
):
    """
    图像转3D模型 - 上传文件方式
    
    参数:
    - file: 上传的图像文件（PNG, JPG, JPEG）
    - model_type: 模型类型（default, cartoon, realistic）
    - texture: 是否生成纹理
    - face_limit: 面数限制（5000-100000）
    
    返回:
    - task_id: 任务ID，用于查询状态
    - status: 任务状态
    - message: 提示信息
    
    示例:
    ```bash
    curl -X POST "http://localhost:8000/api/v1/image-to-3d" \
      -F "file=@image.png" \
      -F "model_type=realistic" \
      -F "texture=true" \
      -F "face_limit=20000"
    ```
    """
    try:
        # 验证文件类型
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="只支持图像文件")
        
        # 读取图像文件
        image_data = await file.read()
        
        # 验证文件大小（10MB限制）
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件大小不能超过10MB")
        
        # 上传图像
        print(f"📤 上传图像: {file.filename}, 大小: {len(image_data)} bytes")
        image_token = await tripo_client.upload_image(image_data)
        print(f"✅ 图像上传成功, token: {image_token}")
        
        # 创建任务
        print(f"🚀 创建3D生成任务...")
        task = await tripo_client.create_task(
            image_token=image_token,
            model_type=model_type.value,
            texture=texture,
            face_limit=face_limit
        )
        
        task_id = task.get("task_id")
        print(f"✅ 任务创建成功: {task_id}")
        
        return TaskResponse(
            task_id=task_id,
            status="queued",
            message="任务已创建，正在排队处理"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

@app.post("/api/v1/image-to-3d/url", response_model=TaskResponse, tags=["3D生成"])
async def image_to_3d_by_url(request: ImageTo3DRequest):
    """
    通过图像URL生成3D模型
    
    参数:
    - image_url: 图像URL（必需）
    - model_type: 模型类型
    - texture: 是否生成纹理
    - face_limit: 面数限制
    
    示例:
    ```bash
    curl -X POST "http://localhost:8000/api/v1/image-to-3d/url" \
      -H "Content-Type: application/json" \
      -d '{
        "image_url": "https://example.com/image.png",
        "model_type": "realistic",
        "texture": true,
        "face_limit": 20000
      }'
    ```
    """
    try:
        if not request.image_url:
            raise HTTPException(status_code=400, detail="image_url是必需的")
        
        # 下载图像
        print(f"📥 下载图像: {request.image_url}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(request.image_url)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="无法下载图像")
            image_data = response.content
        
        print(f"✅ 图像下载成功, 大小: {len(image_data)} bytes")
        
        # 上传图像
        image_token = await tripo_client.upload_image(image_data)
        print(f"✅ 图像上传成功, token: {image_token}")
        
        # 创建任务
        task = await tripo_client.create_task(
            image_token=image_token,
            model_type=request.model_type.value,
            texture=request.texture,
            face_limit=request.face_limit
        )
        
        task_id = task.get("task_id")
        print(f"✅ 任务创建成功: {task_id}")
        
        return TaskResponse(
            task_id=task_id,
            status="queued",
            message="任务已创建，正在排队处理"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

@app.get("/api/v1/task/{task_id}", response_model=TaskStatusResponse, tags=["任务管理"])
async def get_task_status(task_id: str):
    """
    查询任务状态
    
    参数:
    - task_id: 任务ID
    
    返回:
    - task_id: 任务ID
    - status: 状态（queued, running, success, failed）
    - progress: 进度（0-100）
    - model_url: 模型下载URL（完成后可用）
    - preview_url: 预览图URL
    - error_message: 错误信息（如果失败）
    
    示例:
    ```bash
    curl "http://localhost:8000/api/v1/task/abc123xyz"
    ```
    """
    try:
        task = await tripo_client.get_task_status(task_id)
        
        status = task.get("status")
        progress = task.get("progress", 0)
        
        print(f"📊 任务 {task_id}: {status} ({progress}%)")
        
        return TaskStatusResponse(
            task_id=task_id,
            status=status,
            progress=progress,
            model_url=task.get("output", {}).get("model"),
            preview_url=task.get("output", {}).get("preview"),
            error_message=task.get("error_message")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")

@app.get("/api/v1/download/{task_id}", response_class=FileResponse, tags=["模型下载"])
async def download_model(task_id: str, background_tasks: BackgroundTasks):
    """
    下载3D模型文件
    
    参数:
    - task_id: 任务ID
    
    返回:
    - GLB格式的3D模型文件
    
    示例:
    ```bash
    curl "http://localhost:8000/api/v1/download/abc123xyz" -o model.glb
    ```
    """
    try:
        # 获取任务状态
        task = await tripo_client.get_task_status(task_id)
        
        if (task.get("status") != "success"):
            raise HTTPException(
                status_code=400,
                detail=f"任务尚未完成，当前状态: {task.get('status')}"
            )
        
        # 优先使用 pbr_model，回退到 model
        model_url = task.get("output", {}).get("pbr_model") or task.get("output", {}).get("model")
        if not model_url:
            print(f"⚠️ 未找到模型URL，任务状态: {json.dumps(task, indent=2)}")
            raise HTTPException(status_code=404, detail="模型URL不可用")
        
        print(f"📥 下载模型URL: {model_url}")
        
        # 下载模型到临时文件
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.glb')
        await tripo_client.download_model(model_url, temp_file.name)
        print(f"✅ 模型已保存到临时文件: {temp_file.name}")
        
        # 添加后台任务清理临时文件
        background_tasks.add_task(cleanup_temp_file, temp_file.name)
        
        return FileResponse(
            temp_file.name,
            media_type="model/gltf-binary",
            filename=f"{task_id}.glb"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 下载模型失败: {e}")
        raise HTTPException(status_code=500, detail=f"下载失败: {str(e)}")

@app.get("/health", tags=["健康检查"])
async def health_check():
    """
    健康检查接口
    
    返回服务状态和配置信息
    """
    api_key_configured = bool(
        TRIPO3D_API_KEY and 
        TRIPO3D_API_KEY != "sk-apikey"
    )
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_key_configured": api_key_configured,
        "base_url": TRIPO3D_BASE_URL,
        "warning": "请配置 TRIPO3D_API_KEY 环境变量" if not api_key_configured else None
    }

# ==================== 启动配置 ====================
if __name__ == "__main__":
    import uvicorn
    
    # 👉 如果使用了 Settings，可以从配置读取
    try:
        host = settings.host
        port = settings.port
        debug = settings.debug
    except:
        host = "0.0.0.0"
        port = 8002
        debug = True
    
    print(f"""
    ╔══════════════════════════════════════════╗
    ║     Tripo3D FastAPI 服务启动中...       ║
    ╚══════════════════════════════════════════╝
    
    📍 服务地址: http://{host}:{port}
    📚 API文档: http://{host}:{port}/docs
    📖 ReDoc: http://{host}:{port}/redoc
    🔍 健康检查: http://{host}:{port}/health
    
    {'✅ API Key 已配置' if TRIPO3D_API_KEY != 'sk-apikey' else '⚠️  请配置 TRIPO3D_API_KEY'}
    
    按 Ctrl+C 停止服务
    """)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug
    )