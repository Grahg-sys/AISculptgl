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
    
    // 配置选项
    this._config = {
      apiBaseUrl: 'http://localhost:8002', // Tripo3D FastAPI服务地址
      maxRetries: 60, // 最大重试次数
      retryInterval: 5000, // 重试间隔（毫秒）
      timeout: 300000 // 请求超时时间（5分钟）
    };
    
    console.log('🤖 AI模型生成模块已初始化');
    console.log(`📍 API服务地址: ${this._config.apiBaseUrl}`);
    
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
    
    // 创建测试按钮
    const testButton = document.createElement('button');
    testButton.innerHTML = '🧪';
    testButton.style.cssText = `
      position: absolute;
      top: 15px;
      right: 80px;
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 5px;
      transition: color 0.3s ease;
    `;
    testButton.onmouseover = () => testButton.style.color = '#2ecc71';
    testButton.onmouseout = () => testButton.style.color = 'white';
    testButton.onclick = () => this.quickTestBackend();
    testButton.title = '测试后端连接';
    
    // 创建配置按钮
    const configButton = document.createElement('button');
    configButton.innerHTML = '⚙️';
    configButton.style.cssText = `
      position: absolute;
      top: 15px;
      right: 50px;
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 5px;
      transition: color 0.3s ease;
    `;
    configButton.onmouseover = () => configButton.style.color = '#3498db';
    configButton.onmouseout = () => configButton.style.color = 'white';
    configButton.onclick = () => this.showConfigDialog();
    configButton.title = 'API配置';
    
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
    this._modalContent.appendChild(configButton);
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
    const content = document.createElement('div');
    content.style.cssText = `
      width: 100%;
      text-align: center;
    `;
    
    // 服务状态显示
    const serviceInfo = document.createElement('div');
    serviceInfo.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
      padding: 10px;
      margin: 0 20px 20px 20px;
      font-size: 12px;
      color: #bdc3c7;
    `;
    serviceInfo.innerHTML = `
      <div style="margin-bottom: 5px;">
        <strong>服务地址:</strong> ${this._config.apiBaseUrl}
      </div>
      <div style="color: #f39c12;">
        请确保Tripo3D FastAPI服务正在运行
      </div>
    `;
    content.appendChild(serviceInfo);
    
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
    
    content.appendChild(serviceInfo);
    content.appendChild(uploadArea);
    
    container.appendChild(content);
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
    progressBar.className = 'ai-progress-bar';
    progressBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #3498db, #2980b9);
      border-radius: 3px;
      width: 0%;
      transition: width 0.3s ease;
    `;
    
    // 进度文本
    const progressText = document.createElement('div');
    progressText.className = 'ai-progress-text';
    progressText.style.cssText = `
      color: #bdc3c7;
      font-size: 12px;
      margin-top: 10px;
      text-align: center;
    `;
    progressText.textContent = TR('aiGeneratingText');
    
    progressContainer.appendChild(progressBar);
    
    content.appendChild(loadingArea);
    content.appendChild(progressContainer);
    content.appendChild(progressText);
    
    // 错误信息显示区域（初始隐藏）
    const errorMessage = document.createElement('div');
    errorMessage.className = 'ai-error-message';
    errorMessage.style.cssText = `
      color: #e74c3c;
      font-size: 14px;
      margin-top: 20px;
      text-align: center;
      display: none;
      padding: 10px;
      background: rgba(231, 76, 60, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(231, 76, 60, 0.3);
    `;
    content.appendChild(errorMessage);
    
    container.appendChild(content);
  }

  async quickTestBackend() {
    try {
      // 显示测试状态
      const testMessage = document.createElement('div');
      testMessage.id = 'backend-test-message';
      testMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(52, 152, 219, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
      `;
      testMessage.textContent = '正在测试后端服务连接...';
      document.body.appendChild(testMessage);
      
      const isHealthy = await this.checkBackendStatus();
      
      if (isHealthy) {
        testMessage.style.background = 'rgba(39, 174, 96, 0.9)';
        testMessage.textContent = '✅ 后端服务连接正常！';
      } else {
        testMessage.style.background = 'rgba(231, 76, 60, 0.9)';
        testMessage.textContent = '❌ 无法连接到后端服务，请检查服务是否启动';
      }
      
      // 3秒后移除消息
      setTimeout(() => {
        if (document.getElementById('backend-test-message')) {
          document.body.removeChild(testMessage);
        }
      }, 3000);
      
    } catch (error) {
      console.error('后端测试失败:', error);
      alert('测试失败: ' + error.message);
    }
  }

  showConfigDialog() {
    // 创建简单的配置对话框
    const apiUrl = prompt('请输入Tripo3D API服务地址:', this._config.apiBaseUrl);
    if (apiUrl && apiUrl.trim()) {
      this._config.apiBaseUrl = apiUrl.trim();
      console.log(`API地址已更新为: ${this._config.apiBaseUrl}`);
      
      // 测试新的API地址
      this.checkBackendStatus().then(isReady => {
        if (isReady) {
          alert('API地址更新成功，服务连接正常！');
        } else {
          alert('API地址已更新，但无法连接到服务，请检查地址是否正确');
        }
      });
    }
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
    
    // 加载到场景按钮
    const loadToSceneBtn = document.createElement('button');
    loadToSceneBtn.textContent = '加载到场景';
    loadToSceneBtn.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #9b59b6, #8e44ad);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      margin-right: 10px;
    `;
    loadToSceneBtn.onmouseover = () => loadToSceneBtn.style.transform = 'translateY(-2px)';
    loadToSceneBtn.onmouseout = () => loadToSceneBtn.style.transform = 'translateY(0)';
    loadToSceneBtn.onclick = () => this.loadModelToScene();
    
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
      margin-right: 10px;
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
    
    buttonArea.appendChild(loadToSceneBtn);
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

  async checkBackendStatus() {
    try {
      const response = await fetch(`${this._config.apiBaseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      return false;
    } catch (error) {
      console.warn('后端服务检查失败:', error);
      return false;
    }
  }

  async generateModel() {
    if (!this._uploadedImage) {
      alert(TR('aiNoImageUploaded'));
      return;
    }
    
    // 检查后端服务是否可用
    const isBackendReady = await this.checkBackendStatus();
    if (!isBackendReady) {
      alert(`AI服务未启动或不可用，请确保Tripo3D FastAPI服务正在运行（${this._config.apiBaseUrl}）`);
      return;
    }
    
    this._currentStep = 'generating';
    this._isProcessing = true;
    this.updateModalContent();
    
    try {
      // 步骤1: 上传图像并创建任务
      console.log('🚀 开始AI模型生成流程...');
      const formData = new FormData();
      formData.append('file', this._uploadedImage);
      formData.append('model_type', 'realistic'); // 使用写实风格
      formData.append('texture', 'true');
      formData.append('face_limit', '20000');
      
      // 调用Tripo3D FastAPI服务
      console.log(`📡 请求URL: ${this._config.apiBaseUrl}/api/v1/image-to-3d`);
      const uploadResponse = await fetch(`${this._config.apiBaseUrl}/api/v1/image-to-3d`, {
        method: 'POST',
        body: formData,
        timeout: 60000 // 60秒超时
      });
      
      console.log(`📡 响应状态: ${uploadResponse.status} ${uploadResponse.statusText}`);
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ 上传失败详情: ${errorText}`);
        throw new Error(`上传失败 (${uploadResponse.status}): ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      const taskId = uploadResult.task_id;
      console.log(`✅ 任务创建成功: ${taskId}`);
      
      // 步骤2: 轮询任务状态
      console.log('⏳ 等待任务完成...');
      let taskStatus;
      let retryCount = 0;
      
      while (retryCount < this._config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this._config.retryInterval));
        
        const statusResponse = await fetch(`${this._config.apiBaseUrl}/api/v1/task/${taskId}`);
        if (!statusResponse.ok) {
          console.warn(`状态查询失败: ${statusResponse.status} ${statusResponse.statusText}`);
          const errorText = await statusResponse.text();
          console.warn(`错误详情: ${errorText}`);
          continue;
        }
        
        taskStatus = await statusResponse.json();
        console.log(`📊 任务状态: ${taskStatus.status}, 进度: ${taskStatus.progress}%`);
        console.log(`📊 完整状态数据:`, taskStatus);
        
        // 更新UI显示进度
        this.updateProgress(taskStatus.progress);
        
        if (taskStatus.status === 'success') {
          console.log('✅ 任务完成！');
          // 确保有模型URL可用
          if (!taskStatus.model_url && taskStatus.output) {
            taskStatus.model_url = taskStatus.output.pbr_model || taskStatus.output.model;
            console.log(`📊 提取的模型URL: ${taskStatus.model_url}`);
          }
          break;
        } else if (taskStatus.status === 'failed') {
          throw new Error(`任务失败: ${taskStatus.error_message || '未知错误'}`);
        }
        
        retryCount++;
      }
      
      if (retryCount >= this._config.maxRetries) {
        throw new Error('任务超时，请稍后重试');
      }
      
      // 步骤3: 下载模型
      let modelData;
      
      // 首先尝试从任务状态中获取模型URL
      let modelUrl = taskStatus.model_url;
      if (!modelUrl && taskStatus.output) {
        modelUrl = taskStatus.output.pbr_model || taskStatus.output.model;
      }
      
      if (modelUrl) {
        console.log(`📥 使用任务状态中的模型URL: ${modelUrl}`);
        try {
          const modelResponse = await fetch(modelUrl);
          if (modelResponse.ok) {
            modelData = await modelResponse.blob();
          } else {
            console.log(`⚠️ 直接下载模型URL失败，状态码: ${modelResponse.status}`);
          }
        } catch (urlError) {
          console.warn('⚠️ 直接下载模型URL异常:', urlError);
        }
      }
      
      // 如果直接下载失败，尝试通过后端API下载
      if (!modelData) {
        const downloadUrl = `${this._config.apiBaseUrl}/api/v1/download/${taskId}`;
        console.log(`📥 尝试通过后端API下载: ${downloadUrl}`);
        
        try {
          const downloadResponse = await fetch(downloadUrl);
          
          if (!downloadResponse.ok) {
            throw new Error(`无法获取模型下载链接，状态码: ${downloadResponse.status}`);
          }
          
          modelData = await downloadResponse.blob();
          
          if (modelData.size === 0) {
            throw new Error('模型数据为空');
          }
        } catch (downloadError) {
          console.warn('⚠️ 通过API下载失败:', downloadError);
        }
      }
      
      if (modelData) {
        console.log(`✅ 模型下载成功，大小: ${modelData.size} bytes`);
        this._generatedModel = modelData;
        this._currentStep = 'completed';
      } else {
        console.warn('⚠️ 无法获取模型下载链接，但任务已成功完成');
        // 任务成功但没有下载链接，仍然显示成功状态
        this._currentStep = 'completed';
      }
      
    } catch (error) {
      console.error('AI模型生成错误:', error);
      console.error('错误堆栈:', error.stack);
      this._currentStep = 'error';
      // 显示更详细的错误信息
      const errorMessage = error.message || '模型生成失败，请重试';
      this.showError(errorMessage);
    } finally {
      this._isProcessing = false;
      this.updateModalContent();
    }
  }

  updateProgress(progress) {
    // 更新进度条显示
    const progressBar = this._modalContent.querySelector('.ai-progress-bar');
    const progressText = this._modalContent.querySelector('.ai-progress-text');
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${TR('aiGeneratingText')} ${progress}%`;
    }
  }

  showError(message) {
    // 在UI中显示错误信息
    const errorContainer = this._modalContent.querySelector('.ai-error-message');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    } else {
      // 如果没有专门的错误容器，使用alert
      alert(message);
    }
  }

  async loadModelToScene() {
    if (!this._generatedModel) {
      alert(TR('aiNoModelGenerated'));
      return;
    }
    
    try {
      console.log('🔄 将模型加载到场景中...');
      
      // 将Blob转换为ArrayBuffer
      const arrayBuffer = await this._generatedModel.arrayBuffer();
      
      // 触发文件导入事件，让SculptGL处理GLB文件
      // 这里需要调用SculptGL的文件导入功能
      if (this._main.getImport) {
        // 创建一个新的文件对象
        const file = new File([this._generatedModel], 'ai-generated-model.glb', {
          type: 'model/gltf-binary'
        });
        
        // 调用导入功能
        await this._main.getImport().importFile(file);
        console.log('✅ 模型已成功加载到场景中');
        
        // 关闭模态窗口
        this.closeModal();
        
        // 显示成功消息
        alert('AI模型已成功加载到场景中！');
      } else {
        console.warn('无法直接加载到场景，请手动导入下载的模型文件');
        // 如果无法直接加载，则提供下载
        this.downloadModel();
      }
      
    } catch (error) {
      console.error('加载模型到场景失败:', error);
      alert('模型加载失败，请尝试下载后手动导入');
      // 如果加载失败，仍然提供下载选项
      this.downloadModel();
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
    link.download = 'ai-generated-model.glb'; // 改为GLB格式，与Tripo3D输出一致
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ 模型已下载');
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