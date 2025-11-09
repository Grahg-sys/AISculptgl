import TR from 'gui/GuiTR';

class GuiAI {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui; // main gui
    this._menu = null; // ui menu
    this._parent = guiParent;
    
    // AI建模工作流状态
    this._currentStep = 'idle'; // 'idle', 'uploaded', 'generating', 'completed', 'error'
    this._uploadedImage = null; // 上传的图片文件
    this._generatedModel = null; // 生成的模型数据
    this._isProcessing = false; // 是否正在处理
    
    // 模态窗口相关
    this._modal = null;
    this._modalOverlay = null;
    this._modalContent = null;
    
    // 控件引用
    this._ctrlAIModeling = null; // 顶部菜单按钮
    this._onImageUploadedHandler = null;
    
    this.init(guiParent);
  }

  init(guiParent) {
    try {
      // 创建顶部菜单按钮，点击后打开模态窗口
      var menu = this._menu = guiParent.addMenu(TR('aiTitle'));
      this._ctrlAIModeling = menu.addButton(TR('aiOpenModal'), this, 'openModal');
      
      // 创建模态窗口（初始隐藏）
      this.createModal();
      
      console.log('AI建模模块初始化完成');
    } catch (error) {
      console.error('AI模块初始化失败:', error);
      // 确保即使AI模块出错也不影响整个应用
      if (this._menu) {
        this._menu.setVisibility(false);
      }
    }
  }

  createModal() {
    // 创建模态窗口覆盖层
    this._modalOverlay = document.createElement('div');
    this._modalOverlay.className = 'ai-modal-overlay';
    this._modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    // 创建模态窗口内容
    this._modalContent = document.createElement('div');
    this._modalContent.className = 'ai-modal-content';
    this._modalContent.style.cssText = `
      background: linear-gradient(135deg, #2c3e50, #34495e);
      border-radius: 12px;
      padding: 30px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
      color: white;
      font-family: 'Open Sans', sans-serif;
    `;
    
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 15px;
      right: 20px;
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 5px;
      transition: color 0.3s ease;
    `;
    closeButton.onmouseover = () => closeButton.style.color = '#e74c3c';
    closeButton.onmouseout = () => closeButton.style.color = 'white';
    closeButton.onclick = () => this.closeModal();
    
    // 创建标题
    const title = document.createElement('h2');
    title.textContent = TR('aiModalTitle');
    title.style.cssText = `
      margin: 0 0 20px 0;
      text-align: center;
      color: #3498db;
      font-weight: 600;
      font-size: 24px;
    `;
    
    // 创建内容区域
    const contentArea = document.createElement('div');
    contentArea.className = 'ai-modal-body';
    contentArea.style.cssText = `
      min-height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;
    
    // 组装模态窗口
    this._modalContent.appendChild(closeButton);
    this._modalContent.appendChild(title);
    this._modalContent.appendChild(contentArea);
    this._modalOverlay.appendChild(this._modalContent);
    document.body.appendChild(this._modalOverlay);
    
    // 点击覆盖层关闭模态窗口
    this._modalOverlay.onclick = (e) => {
      if (e.target === this._modalOverlay) {
        this.closeModal();
      }
    };
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // 初始化内容
    this.updateModalContent();
  }

  handleResize() {
    // 处理窗口大小变化
    if (this._modalOverlay && this._modalOverlay.style.display === 'flex') {
      // 可以在这里添加响应式调整逻辑
      const maxWidth = window.innerWidth < 768 ? '95%' : '600px';
      this._modalContent.style.maxWidth = maxWidth;
    }
  }

  openModal() {
    if (this._modalOverlay) {
      this._modalOverlay.style.display = 'flex';
      this.updateModalContent();
    }
  }

  closeModal() {
    if (this._modalOverlay) {
      this._modalOverlay.style.display = 'none';
      // 重置状态但不清除已上传的图片和生成的模型
    }
  }

  updateModalContent() {
    const contentArea = this._modalContent.querySelector('.ai-modal-body');
    if (!contentArea) return;
    
    contentArea.innerHTML = '';
    
    switch (this._currentStep) {
      case 'idle':
        this.renderUploadStep(contentArea);
        break;
      case 'uploaded':
        this.renderUploadedStep(contentArea);
        break;
      case 'generating':
        this.renderGeneratingStep(contentArea);
        break;
      case 'completed':
        this.renderCompletedStep(contentArea);
        break;
      case 'error':
        this.renderErrorStep(contentArea);
        break;
    }
  }

  renderUploadStep(container) {
    const uploadArea = document.createElement('div');
    uploadArea.style.cssText = `
      width: 100%;
      height: 300px;
      border: 3px dashed #3498db;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(52, 152, 219, 0.1);
      position: relative;
      backdrop-filter: blur(10px);
    `;
    
    uploadArea.onmouseover = () => {
      uploadArea.style.background = 'rgba(52, 152, 219, 0.2)';
      uploadArea.style.borderColor = '#2980b9';
      uploadArea.style.transform = 'translateY(-2px)';
      uploadArea.style.boxShadow = '0 10px 30px rgba(52, 152, 219, 0.2)';
    };
    
    uploadArea.onmouseout = () => {
      uploadArea.style.background = 'rgba(52, 152, 219, 0.1)';
      uploadArea.style.borderColor = '#3498db';
      uploadArea.style.transform = 'translateY(0)';
      uploadArea.style.boxShadow = 'none';
    };
    
    uploadArea.innerHTML = `
      <div style="font-size: 48px; color: #3498db; margin-bottom: 20px; animation: float 3s ease-in-out infinite;">📷</div>
      <div style="font-size: 18px; color: #3498db; margin-bottom: 10px; font-weight: 600;">
        ${TR('aiUploadPrompt')}
      </div>
      <div style="font-size: 14px; color: #bdc3c7;">
        ${TR('aiUploadHint')}
      </div>
    `;
    
    // 添加浮动动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
    `;
    document.head.appendChild(style);
    
    uploadArea.onclick = () => this.triggerFileUpload();
    
    container.appendChild(uploadArea);
  }

  triggerFileUpload() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        this.handleImageUpload(file);
      }
      // 清理
      document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert(TR('aiInvalidImage'));
      return;
    }
    
    this._uploadedImage = file;
    this._currentStep = 'uploaded';
    this.updateModalContent();
    console.log('AI图片上传成功:', file.name);
  }

  renderUploadedStep(container) {
    const content = document.createElement('div');
    content.style.cssText = `
      width: 100%;
      text-align: center;
    `;
    
    // 图片预览
    const previewArea = document.createElement('div');
    previewArea.style.cssText = `
      width: 100%;
      height: 250px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
      border: 2px solid #3498db;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2c3e50;
    `;
    
    // 显示图片
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      `;
      previewArea.appendChild(img);
    };
    reader.readAsDataURL(this._uploadedImage);
    
    // 图片信息
    const info = document.createElement('div');
    info.style.cssText = `
      color: #bdc3c7;
      font-size: 14px;
      margin-bottom: 20px;
    `;
    info.textContent = `${this._uploadedImage.name} (${(this._uploadedImage.size / 1024).toFixed(1)} KB)`;
    
    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    `;
    
    // 重新上传按钮
    const reuploadBtn = document.createElement('button');
    reuploadBtn.textContent = TR('aiReuploadImage');
    reuploadBtn.style.cssText = `
      padding: 12px 24px;
      background: #7f8c8d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.3s ease;
    `;
    reuploadBtn.onmouseover = () => reuploadBtn.style.background = '#95a5a6';
    reuploadBtn.onmouseout = () => reuploadBtn.style.background = '#7f8c8d';
    reuploadBtn.onclick = () => this.triggerFileUpload();
    
    // 生成模型按钮
    const generateBtn = document.createElement('button');
    generateBtn.textContent = TR('aiGenerateModel');
    generateBtn.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    generateBtn.onmouseover = () => generateBtn.style.transform = 'translateY(-2px)';
    generateBtn.onmouseout = () => generateBtn.style.transform = 'translateY(0)';
    generateBtn.onclick = () => this.generateModel();
    
    buttonArea.appendChild(reuploadBtn);
    buttonArea.appendChild(generateBtn);
    
    content.appendChild(previewArea);
    content.appendChild(info);
    content.appendChild(buttonArea);
    
    container.appendChild(content);
  }

  renderGeneratingStep(container) {
    const content = document.createElement('div');
    content.style.cssText = `
      width: 100%;
      text-align: center;
      padding: 40px 0;
    `;
    
    // 加载动画
    const loadingArea = document.createElement('div');
    loadingArea.style.cssText = `
      margin-bottom: 30px;
    `;
    
    // 创建CSS动画
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 60px;
      height: 60px;
      border: 4px solid rgba(52, 152, 219, 0.3);
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    `;
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    const loadingText = document.createElement('div');
    loadingText.style.cssText = `
      color: #3498db;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
    `;
    loadingText.textContent = TR('aiGeneratingText');
    
    const loadingSubtext = document.createElement('div');
    loadingSubtext.style.cssText = `
      color: #bdc3c7;
      font-size: 14px;
    `;
    loadingSubtext.textContent = TR('aiGeneratingSubtext');
    
    loadingArea.appendChild(spinner);
    loadingArea.appendChild(loadingText);
    loadingArea.appendChild(loadingSubtext);
    
    // 进度条
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 80%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      margin: 0 auto;
      overflow: hidden;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #3498db, #2980b9);
      border-radius: 3px;
      width: 0%;
      animation: progress 3s ease-in-out infinite;
    `;
    
    // 添加进度条动画
    const progressStyle = document.createElement('style');
    progressStyle.textContent = `
      @keyframes progress {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
    `;
    document.head.appendChild(progressStyle);
    
    progressContainer.appendChild(progressBar);
    
    content.appendChild(loadingArea);
    content.appendChild(progressContainer);
    
    container.appendChild(content);
  }

  renderCompletedStep(container) {
    const content = document.createElement('div');
    content.style.cssText = `
      width: 100%;
      text-align: center;
      padding: 20px 0;
    `;
    
    // 成功图标
    const successIcon = document.createElement('div');
    successIcon.style.cssText = `
      font-size: 64px;
      color: #27ae60;
      margin-bottom: 20px;
    `;
    successIcon.textContent = '✅';
    
    // 成功消息
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
      color: #27ae60;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
    `;
    successMessage.textContent = TR('aiGenerationComplete');
    
    // 模型信息
    const modelInfo = document.createElement('div');
    modelInfo.style.cssText = `
      color: #bdc3c7;
      font-size: 14px;
      margin-bottom: 30px;
    `;
    modelInfo.textContent = TR('aiModelReady');
    
    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    `;
    
    // 下载模型按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = TR('aiDownloadModel');
    downloadBtn.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #27ae60, #229954);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    downloadBtn.onmouseover = () => downloadBtn.style.transform = 'translateY(-2px)';
    downloadBtn.onmouseout = () => downloadBtn.style.transform = 'translateY(0)';
    downloadBtn.onclick = () => this.downloadModel();
    
    // 重新生成按钮
    const regenerateBtn = document.createElement('button');
    regenerateBtn.textContent = TR('aiRegenerateModel');
    regenerateBtn.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    regenerateBtn.onmouseover = () => regenerateBtn.style.transform = 'translateY(-2px)';
    regenerateBtn.onmouseout = () => regenerateBtn.style.transform = 'translateY(0)';
    regenerateBtn.onclick = () => {
      this._currentStep = 'uploaded';
      this.updateModalContent();
    };
    
    buttonArea.appendChild(downloadBtn);
    buttonArea.appendChild(regenerateBtn);
    
    content.appendChild(successIcon);
    content.appendChild(successMessage);
    content.appendChild(modelInfo);
    content.appendChild(buttonArea);
    
    container.appendChild(content);
  }

  renderErrorStep(container) {
    const content = document.createElement('div');
    content.style.cssText = `
      width: 100%;
      text-align: center;
      padding: 40px 0;
    `;
    
    // 错误图标
    const errorIcon = document.createElement('div');
    errorIcon.style.cssText = `
      font-size: 64px;
      color: #e74c3c;
      margin-bottom: 20px;
    `;
    errorIcon.textContent = '❌';
    
    // 错误消息
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
      color: #e74c3c;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
    `;
    errorMessage.textContent = TR('aiGenerationError');
    
    // 错误描述
    const errorDesc = document.createElement('div');
    errorDesc.style.cssText = `
      color: #bdc3c7;
      font-size: 14px;
      margin-bottom: 30px;
    `;
    errorDesc.textContent = TR('aiErrorDescription');
    
    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    `;
    
    // 重试按钮
    const retryBtn = document.createElement('button');
    retryBtn.textContent = TR('aiRetry');
    retryBtn.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    retryBtn.onmouseover = () => retryBtn.style.transform = 'translateY(-2px)';
    retryBtn.onmouseout = () => retryBtn.style.transform = 'translateY(0)';
    retryBtn.onclick = () => this.generateModel();
    
    // 返回上传按钮
    const backBtn = document.createElement('button');
    backBtn.textContent = TR('aiBackToUpload');
    backBtn.style.cssText = `
      padding: 12px 24px;
      background: #7f8c8d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.3s ease;
    `;
    backBtn.onmouseover = () => backBtn.style.background = '#95a5a6';
    backBtn.onmouseout = () => backBtn.style.background = '#7f8c8d';
    backBtn.onclick = () => {
      this._currentStep = 'uploaded';
      this.updateModalContent();
    };
    
    buttonArea.appendChild(retryBtn);
    buttonArea.appendChild(backBtn);
    
    content.appendChild(errorIcon);
    content.appendChild(errorMessage);
    content.appendChild(errorDesc);
    content.appendChild(buttonArea);
    
    container.appendChild(content);
  }

  async generateModel() {
    if (!this._uploadedImage) {
      alert(TR('aiNoImageUploaded'));
      return;
    }
    
    this._currentStep = 'generating';
    this._isProcessing = true;
    this.updateModalContent();
    
    try {
      // 创建FormData并添加图片
      const formData = new FormData();
      formData.append('image', this._uploadedImage);
      
      // TODO: 这里填入你的后端API接口地址
      const response = await fetch('/api/generate-model', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // 获取生成的OBJ文件
        const objData = await response.blob();
        this._generatedModel = objData;
        this._currentStep = 'completed';
      } else {
        throw new Error('Backend API failed');
      }
      
    } catch (error) {
      console.error('AI model generation error:', error);
      this._currentStep = 'error';
    } finally {
      this._isProcessing = false;
      this.updateModalContent();
    }
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

  // 清理资源
  cleanup() {
    if (this._modalOverlay) {
      document.body.removeChild(this._modalOverlay);
      this._modalOverlay = null;
      this._modalContent = null;
    }
  }

  updateMesh() {
    // AI建模菜单始终可见，不需要依赖网格
    if (this._menu) {
      this._menu.setVisibility(true);
    }
  }

  removeEvents() {
    // 清理事件监听
    if (this._modalOverlay) {
      this._modalOverlay.onclick = null;
    }
  }

  createMockOBJFile() {
    // 创建一个简单的OBJ文件作为模拟（用于测试）
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