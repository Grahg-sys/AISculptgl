import TR from 'gui/GuiTR';

class GuiAI {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui; // main gui
    this._menu = null; // ui menu
    this._parent = guiParent;
    
    // AI建模工作流状态
    this._currentStep = 0; // 0: 上传, 1: 生成中, 2: 完成
    this._uploadedImage = null; // 上传的图片文件
    this._generatedModel = null; // 生成的模型数据
    this._isProcessing = false; // 是否正在处理
    
    // 控件引用
    this._step1Container = null;
    this._step2Container = null;
    this._step3Container = null;
    this._ctrlUploadButton = null;
    this._ctrlImagePreview = null;
    this._ctrlGenerateModel = null;
    this._ctrlDownloadModel = null;
    this._ctrlStatus = null;
    this._ctrlProgress = null;
    this._onImageUploadedHandler = null;
    
    // 图片预览相关
    this._ctrlImageInfo = null;
    
    this.init(guiParent);
  }

  init(guiParent) {
    try {
      var menu = this._menu = guiParent.addMenu(TR('aiTitle'));
      
      // 步骤1: 上传图片
      this._step1Container = menu.addTitle(TR('aiUploadTitle'));
      this._ctrlUploadButton = menu.addButton(TR('aiUploadImage'), this, 'uploadImage');
      this._ctrlImagePreview = menu.addButton(TR('aiImagePreview'), this, 'previewImage');
      this._ctrlImagePreview.setVisibility(false);
      
      // 使用文本控件显示图片信息（yagui框架兼容方式）
      this._ctrlImageInfo = menu.addTitle(TR('aiImageInfo'));
      this._ctrlImageInfo.setVisibility(false);
      
      // 添加测试用的文件输入控件（调试用）
      this._ctrlTestUpload = menu.addButton('🧪 测试上传', this, 'testUpload');
      
      // 步骤2: 生成模型
      this._step2Container = menu.addTitle(TR('aiGenerateTitle'));
      this._ctrlGenerateModel = menu.addButton(TR('aiGenerateModel'), this, 'generateModel');
      this._ctrlGenerateModel.setVisibility(false);
      this._ctrlProgress = menu.addProgress(TR('aiProgress'));
      this._ctrlProgress.setVisibility(false);
      
      // 步骤3: 下载模型
      this._step3Container = menu.addTitle(TR('aiDownloadTitle'));
      this._ctrlDownloadModel = menu.addButton(TR('aiDownloadModel'), this, 'downloadModel');
      this._ctrlDownloadModel.setVisibility(false);
      
      // 状态信息
      this._ctrlStatus = menu.addTitle(TR('aiStatus'));
      this._ctrlStatus.setText(TR('aiStatusReady'));
      
      this.updateInterface();
      this.addEvents();
    } catch (error) {
      console.error('AI模块初始化失败:', error);
      // 确保即使AI模块出错也不影响整个应用
      if (this._menu) {
        this._menu.setVisibility(false);
      }
    }
  }

  testUpload() {
    console.log('🧪 测试上传功能开始');
    
    // 创建一个新的文件输入元素用于测试
    const testInput = document.createElement('input');
    testInput.type = 'file';
    testInput.accept = 'image/*';
    testInput.style.display = 'block';
    testInput.style.position = 'fixed';
    testInput.style.top = '50%';
    testInput.style.left = '50%';
    testInput.style.transform = 'translate(-50%, -50%)';
    testInput.style.zIndex = '9999';
    
    document.body.appendChild(testInput);
    
    testInput.addEventListener('change', (event) => {
      console.log('🧪 测试文件选择事件触发');
      const file = event.target.files[0];
      if (file) {
        console.log('🧪 测试文件已选择:', file.name);
        this.onImageUploaded(file);
      }
      // 清理测试元素
      document.body.removeChild(testInput);
    });
    
    // 触发测试文件选择
    testInput.click();
    console.log('🧪 测试文件选择对话框已触发');
  }

  uploadImage() {"instruction":"添加测试上传功能"}
    try {
      // 获取文件输入元素
      const fileInput = document.getElementById('aiimageopen');
      if (!fileInput) {
        console.error('AI图片上传元素未找到');
        alert('AI图片上传功能暂时不可用，请刷新页面重试');
        return;
      }
      
      console.log('找到AI图片上传元素，准备触发点击事件');
      console.log('文件输入元素状态:', {
        id: fileInput.id,
        type: fileInput.type,
        style: fileInput.style.cssText,
        display: window.getComputedStyle(fileInput).display
      });
      
      // 重置文件输入，允许重复选择同一文件
      fileInput.value = '';
      
      // 确保文件输入元素是可见的（临时显示用于调试）
      const originalDisplay = fileInput.style.display;
      if (originalDisplay === 'none') {
        fileInput.style.display = 'block';
        fileInput.style.position = 'absolute';
        fileInput.style.left = '-9999px';
        fileInput.style.top = '-9999px';
        console.log('临时显示文件输入元素用于调试');
      }
      
      // 触发文件选择对话框
      fileInput.click();
      
      // 恢复原始显示状态
      if (originalDisplay === 'none') {
        fileInput.style.display = originalDisplay;
      }
      
      console.log('AI图片上传对话框已触发');
    } catch (error) {
      console.error('AI图片上传出错:', error);
      alert('AI图片上传功能出错，请检查控制台日志');
    }
  }

  previewImage() {
    if (this._uploadedImage) {
      // 在新窗口中预览图片
      const url = URL.createObjectURL(this._uploadedImage);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  }

  showImagePreview(file) {
    try {
      console.log('开始显示图片预览');
      
      // 显示图片信息标题
      if (this._ctrlImageInfo) {
        this._ctrlImageInfo.setVisibility(true);
        console.log('图片信息控件已设置为可见');
        
        // 设置图片信息文本
        const imageInfo = `文件名: ${file.name} | 大小: ${(file.size / 1024).toFixed(1)} KB | 类型: ${file.type}`;
        this._ctrlImageInfo.setText(imageInfo);
        console.log('图片信息已设置:', imageInfo);
      }
      
      console.log('AI图片信息已显示');
    } catch (error) {
      console.error('显示图片预览时出错:', error);
    }
  }

  hideImagePreview() {
    if (this._ctrlImageInfo) {
      this._ctrlImageInfo.setVisibility(false);
    }
  }

  onImageUploaded(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert(TR('aiInvalidImage'));
      return;
    }
    
    this._uploadedImage = file;
    this._currentStep = 1;
    
    // 显示图片预览
    this.showImagePreview(file);
    
    this.updateInterface();
    this._ctrlStatus.setText(TR('aiStatusImageUploaded'));
    
    console.log('AI图片上传成功:', file.name, '大小:', (file.size / 1024).toFixed(1), 'KB');
    console.log('当前步骤:', this._currentStep, '是否有图片:', !!this._uploadedImage);
    
    // 显示上传成功的提示
    alert('图片上传成功！现在可以生成3D模型了。');
  }

  async generateModel() {
    if (!this._uploadedImage) {
      alert(TR('aiNoImageUploaded'));
      return;
    }
    
    this._isProcessing = true;
    this._currentStep = 2;
    this.updateInterface();
    this._ctrlStatus.setText(TR('aiStatusGenerating'));
    this.showProgress(true);
    
    try {
      // 创建FormData并添加图片
      const formData = new FormData();
      formData.append('image', this._uploadedImage);
      
      // 先尝试调用后端API
      try {
        const response = await fetch('/api/generate-model', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          // 获取生成的OBJ文件
          const objData = await response.blob();
          this._generatedModel = objData;
          this._currentStep = 3;
          this._ctrlStatus.setText(TR('aiStatusComplete'));
        } else {
          throw new Error('Backend API failed');
        }
      } catch (apiError) {
        console.warn('后端API调用失败，使用前端模拟:', apiError);
        // 前端模拟：创建一个简单的OBJ文件
        this._generatedModel = this.createMockOBJFile();
        this._currentStep = 3;
        this._ctrlStatus.setText(TR('aiStatusComplete'));
        alert('AI模型生成完成！（当前为演示模式）');
      }
      
    } catch (error) {
      console.error('AI model generation error:', error);
      this._ctrlStatus.setText(TR('aiStatusError'));
      alert(TR('aiGenerationError'));
    } finally {
      this._isProcessing = false;
      this.showProgress(false);
      this.updateInterface();
    }
  }

  downloadModel() {
    if (!this._generatedModel) {
      alert(TR('aiNoModelGenerated'));
      return;
    }
    
    // 创建下载链接
    const url = URL.createObjectURL(this._generatedModel);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ai-generated-model.obj';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this._ctrlStatus.setText(TR('aiStatusDownloaded'));
  }

  updateInterface() {
    // 根据当前步骤显示/隐藏相关控件
    const hasImage = !!this._uploadedImage;
    const hasModel = !!this._generatedModel;
    const isProcessing = this._isProcessing;
    
    console.log('更新界面 - 有图片:', hasImage, '有模型:', hasModel, '处理中:', isProcessing, '当前步骤:', this._currentStep);
    
    // 步骤1: 上传图片
    this._ctrlImagePreview.setVisibility(hasImage);
    this._ctrlUploadButton.setText(hasImage ? TR('aiReuploadImage') : TR('aiUploadImage'));
    
    // 图片信息控件
    if (this._ctrlImageInfo) {
      this._ctrlImageInfo.setVisibility(hasImage);
      console.log('图片信息控件设置为:', hasImage ? '显示' : '隐藏');
    }
    
    // 步骤2: 生成模型
    const shouldShowGenerate = hasImage && !isProcessing && !hasModel;
    this._ctrlGenerateModel.setVisibility(shouldShowGenerate);
    console.log('生成模型按钮设置为:', shouldShowGenerate ? '显示' : '隐藏');
    this._ctrlProgress.setVisibility(isProcessing);
    
    // 步骤3: 下载模型
    this._ctrlDownloadModel.setVisibility(hasModel && !isProcessing);
    
    // 添加调试信息
    console.log('AI界面更新完成，当前步骤:', this._currentStep, '状态:', {
      hasImage: hasImage,
      hasModel: hasModel,
      isProcessing: isProcessing,
      uploadVisible: !hasImage && !isProcessing,
      generateVisible: hasImage && !isProcessing && !hasModel,
      downloadVisible: hasModel && !isProcessing
    });
  }

  showProgress(show) {
    if (this._ctrlProgress) {
      this._ctrlProgress.setVisibility(show);
      if (show) {
        this._ctrlProgress.setValue(0);
        // 模拟进度条动画
        var progress = 0;
        var interval = setInterval(() => {
          progress += Math.random() * 0.15;
          if (progress >= 1) {
            progress = 1;
            clearInterval(interval);
          }
          this._ctrlProgress.setValue(progress);
        }, 300);
      }
    }
  }

  createMockOBJFile() {
    // 创建一个简单的OBJ文件作为模拟
    const objContent = `# Simple Cube OBJ File
# Generated by SculptGL AI Module (Demo Mode)

# Vertices
v -1.0 -1.0 1.0
v 1.0 -1.0 1.0
v -1.0 1.0 1.0
v 1.0 1.0 1.0
v -1.0 1.0 -1.0
v 1.0 1.0 -1.0
v -1.0 -1.0 -1.0
v 1.0 -1.0 -1.0

# Normals
vn 0.0 0.0 1.0
vn 0.0 0.0 -1.0
vn 0.0 1.0 0.0
vn 0.0 -1.0 0.0
vn 1.0 0.0 0.0
vn -1.0 0.0 0.0

# Faces
f 1//1 2//1 4//1 3//1
f 5//2 6//2 8//2 7//2
f 3//3 4//3 6//3 5//3
f 7//4 8//4 2//4 1//4
f 2//5 8//5 6//5 4//5
f 7//6 1//6 3//6 5//6
`;
    
    return new Blob([objContent], { type: 'text/plain' });
  }

  addEvents() {
    // 监听图片上传事件
    const fileInput = document.getElementById('aiimageopen');
    if (!fileInput) {
      console.error('文件上传元素未找到，重试中...');
      setTimeout(() => {
        this.addEvents();
      }, 1000); // 增加重试间隔到1秒
      return;
    }
    
    console.log('AI图片上传监听器已添加');
    
    // 使用箭头函数确保this上下文正确
    const handleFileChange = (event) => {
      console.log('上传事件触发，文件数量:', event.target.files.length);
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        console.log('文件信息:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
        this.onImageUploaded(file);
      }
      // 清空input，允许重复上传同一文件
      event.target.value = '';
    };
    
    // 移除旧的事件监听器（如果有的话）
    fileInput.removeEventListener('change', handleFileChange);
    // 添加新的事件监听器
    fileInput.addEventListener('change', handleFileChange);
    this._onImageUploadedHandler = handleFileChange;
    
    console.log('文件上传事件监听器已绑定');
  }

  removeEvents() {
    // 移除事件监听
    const fileInput = document.getElementById('aiimageopen');
    if (fileInput) {
      fileInput.removeEventListener('change', this._onImageUploadedHandler);
    }
  }

  updateMesh() {
    // AI建模菜单始终可见，不需要依赖网格
    if (this._menu) {
      this._menu.setVisibility(true);
    }
    
    // 检查AI文件上传元素是否存在
    const fileInput = document.getElementById('aiimageopen');
    if (!fileInput) {
      console.warn('AI图片上传元素(aiimageopen)未找到，上传功能可能无法正常工作');
    } else {
      console.log('AI图片上传元素已找到，上传功能准备就绪');
    }
  }
}

export default GuiAI;