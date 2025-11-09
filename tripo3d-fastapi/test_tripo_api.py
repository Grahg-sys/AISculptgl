#!/usr/bin/env python3
"""
Tripo3D API 格式测试
"""
import httpx
import asyncio
import base64
import json
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TRIPO3D_API_KEY")
BASE_URL = os.getenv("TRIPO3D_BASE_URL", "https://api.tripo3d.ai/v2/openapi")

async def test_formats():
    """测试不同的API格式"""
    
    # 创建一个简单的测试图片
    from PIL import Image
    import io
    
    img = Image.new('RGB', (512, 512), color=(76, 175, 80))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    image_data = img_bytes.getvalue()
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 测试格式1: 标准格式
    print("📝 测试格式 1: 标准格式")
    payload1 = {
        "type": "image_to_model",
        "file": {
            "type": "png",
            "data": image_base64
        }
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/task",
                headers=headers,
                json=payload1
            )
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text[:300]}")
        except Exception as e:
            print(f"错误: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # 测试格式2: data URL格式
    print("📝 测试格式 2: data URL")
    payload2 = {
        "type": "image_to_model",
        "file": f"data:image/png;base64,{image_base64}"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/task",
                headers=headers,
                json=payload2
            )
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text[:300]}")
        except Exception as e:
            print(f"错误: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # 测试格式3: 简化格式
    print("📝 测试格式 3: 简化格式")
    payload3 = {
        "type": "image_to_model",
        "image": image_base64
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/task",
                headers=headers,
                json=payload3
            )
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text[:300]}")
        except Exception as e:
            print(f"错误: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # 测试获取账户信息（验证API Key）
    print("📝 测试 API Key 有效性")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 尝试获取任务列表
            response = await client.get(
                f"{BASE_URL}/task",
                headers=headers,
                params={"page": 1, "size": 1}
            )
            print(f"任务列表状态码: {response.status_code}")
            print(f"响应: {response.text[:300]}")
        except Exception as e:
            print(f"错误: {e}")

if __name__ == "__main__":
    asyncio.run(test_formats())