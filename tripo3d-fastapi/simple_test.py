#!/usr/bin/env python3
"""
Tripo3D API 简化测试脚本 - 使用本地图片
"""

import requests
import json
import base64
from pathlib import Path

BASE_URL = "http://localhost:8002"

def test_health():
    """测试健康检查"""
    print("🔍 测试健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        data = response.json()
        print(f"✅ 服务状态: {data['status']}")
        print(f"✅ API Key 配置: {data['api_key_configured']}")
        return True
    except Exception as e:
        print(f"❌ 健康检查失败: {e}")
        return False

def create_test_image():
    """创建一个简单的测试图片"""
    from PIL import Image, ImageDraw, ImageFont
    import io
    
    # 创建一个简单的测试图片
    img = Image.new('RGB', (512, 512), color=(76, 175, 80))
    draw = ImageDraw.Draw(img)
    
    # 添加文字
    try:
        draw.text((200, 250), "TEST", fill=(255, 255, 255))
    except:
        pass
    
    # 保存到内存
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes

def test_file_upload():
    """测试通过文件上传生成3D"""
    print("\n🖼️  测试通过文件上传生成3D...")
    
    try:
        # 创建测试图片
        print("📸 创建测试图片...")
        img_bytes = create_test_image()
        
        files = {
            'file': ('test.png', img_bytes, 'image/png')
        }
        
        data = {
            'model_type': 'default',
            'texture': True,
            'face_limit': 10000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/v1/image-to-3d",
            files=files,
            data=data,
            timeout=30
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 任务创建成功!")
            print(f"🆔 Task ID: {result['task_id']}")
            print(f"📊 状态: {result['status']}")
            print(f"💬 消息: {result['message']}")
            return result['task_id']
        else:
            print(f"❌ 请求失败")
            print(f"错误详情: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_with_local_file():
    """使用本地图片文件测试"""
    print("\n🖼️  测试使用本地图片文件...")
    
    # 检查是否有测试图片
    test_images = list(Path('.').glob('*.png')) + list(Path('.').glob('*.jpg'))
    
    if not test_images:
        print("⚠️  未找到本地图片文件，将创建测试图片")
        return test_file_upload()
    
    image_path = test_images[0]
    print(f"📁 使用图片: {image_path}")
    
    try:
        with open(image_path, 'rb') as f:
            files = {
                'file': (image_path.name, f, 'image/png')
            }
            
            data = {
                'model_type': 'default',
                'texture': True,
                'face_limit': 10000
            }
            
            response = requests.post(
                f"{BASE_URL}/api/v1/image-to-3d",
                files=files,
                data=data,
                timeout=30
            )
            
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 任务创建成功!")
                print(f"🆔 Task ID: {result['task_id']}")
                return result['task_id']
            else:
                print(f"❌ 请求失败: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return None

def check_task_status(task_id):
    """检查任务状态"""
    if not task_id:
        return
    
    print(f"\n📊 检查任务状态: {task_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/task/{task_id}", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"📈 状态: {result['status']}")
            print(f"📊 进度: {result['progress']}%")
            
            if result.get('model_url'):
                print(f"🔗 模型URL: {result['model_url']}")
            if result.get('preview_url'):
                print(f"👁️  预览URL: {result['preview_url']}")
            if result.get('error_message'):
                print(f"❌ 错误: {result['error_message']}")
                
            return result['status']
        else:
            print(f"❌ 查询失败: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 状态查询失败: {e}")
        return None

def main():
    """主函数"""
    print("""
    ╔══════════════════════════════════════════╗
    ║     Tripo3D API 功能测试                 ║
    ╚══════════════════════════════════════════╝
    """)
    
    # 1. 测试健康检查
    if not test_health():
        print("\n❌ 服务未正常运行，测试终止")
        return
    
    # 2. 测试文件上传方式
    print("\n选择测试方式:")
    print("1. 使用生成的测试图片")
    print("2. 使用本地图片文件")
    
    # 尝试文件上传测试
    task_id = test_with_local_file()
    
    # 3. 检查任务状态
    if task_id:
        check_task_status(task_id)
        
        print(f"\n✅ API功能测试完成!")
        print(f"🆔 任务ID: {task_id}")
    else:
        print(f"\n❌ 测试失败，请检查API配置")

if __name__ == "__main__":
    main()