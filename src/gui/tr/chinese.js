var TR = {
  // background
  backgroundTitle: '背景',
  backgroundReset: '重置',
  backgroundImport: '导入 (jpg, png...)',
  backgroundFill: '填充',

  // camera
  cameraTitle: '镜头',
  cameraReset: '检视',
  cameraCenter: '重置 (空格键)',
  cameraFront: '前视角 (F)',
  cameraLeft: '左视角 (L)',
  cameraTop: '俯视角 (T)',
  cameraMode: '模式',
  cameraOrbit: '轨道 (转盘)',
  cameraSpherical: '球面 (轨迹球)',
  cameraPlane: '平面 (轨迹球)',
  cameraProjection: '投影',
  cameraPerspective: '透视角',
  cameraOrthographic: '等视角',
  cameraFov: '视野范围',
  cameraPivot: '选择轴心',

  // file
  fileTitle: '文件 (导入/导出)',
  fileImportTitle: '导入',
  fileAdd: '加入 (obj, sgl, ply, stl)',
  fileAutoMatrix: '缩放并居中',
  fileVertexSRGB: 'sRGB 顶点色彩',
  fileExportSceneTitle: '导出场景',
  fileExportAll: '导出全部',
  fileExportSGL: '保存 .sgl (SculptGL)',
  fileExportOBJ: '保存 .obj',
  fileExportPLY: '保存 .ply',
  fileExportSTL: '保存 .stl',

  fileExportTextureTitle: null,
  fileExportTextureSize: null,
  fileExportColor: null,
  fileExportRoughness: null,
  fileExportMetalness: null,

  // scene
  sceneTitle: '场景',
  sceneReset: '清除场景',
  sceneResetConfirm: '确认清除场景',
  sceneAddSphere: '加入球体',
  sceneAddCube: '加入立方体',
  sceneAddCylinder: '加入圆柱',
  sceneAddTorus: '加入圆环',
  sceneSelection: '选取项目',
  sceneMerge: '合并选取项目',
  sceneDuplicate: '删除选择',
  sceneDuplicate: null,

  // mesh
  meshTitle: '网面',
  meshNbVertices: '顶点 : ',
  meshNbFaces: '面 : ',

  // topology
  topologyTitle: '网面结构(拓扑)',

  //multires
  multiresTitle: '多重解析度',
  multiresSubdivide: '细分',
  multiresReverse: '反转',
  multiresResolution: '解析度',
  multiresNoLower: '没有更低等级的解析度。',
  multiresNoHigher: '没有更高等级的解析度。',
  multiresDelHigher: '删除较高等级',
  multiresDelLower: '删除较低等级',
  multiresSelectLowest: '反转前请先选择最低的解析度。',
  multiresSelectHighest: '细分前请先选择最高的解析度。',
  multiresWarnBigMesh: function (nbFacesNext) {
    return '下一个细分等级会达到 ' + nbFacesNext + ' 个面。\n' +
      '若你清楚你自己正在做什么，再点击「细分」一次。';
  },
  multiresNotReversible: '抱歉，无法反转此网面。\n' +
    '此网面不是由流形网面经过细分曲面 (loop-catmull) 而来。',

  // remesh
  remeshTitle: '立体像素网面重构',
  remeshRemesh: '网面重构',
  remeshResolution: '解析度',
  remeshBlock: '块状重构',

  // dynamic
  dynamicTitle: '动态网面结构',
  dynamicActivated: '启用 (无四边形)',
  dynamicSubdivision: '细分',
  dynamicDecimation: '削减面数',
  dynamicLinear: '线性细分',

  // sculpt
  sculptTitle: '雕刻和涂绘',
  sculptBrush: '笔刷',
  sculptInflate: '膨胀',
  sculptTwist: '扭转',
  sculptSmooth: '平滑 (-Shift)',
  sculptFlatten: '抹平',
  sculptPinch: '捏塑',
  sculptCrease: '皱褶',
  sculptDrag: '拖拉',
  sculptPaint: '涂绘',
  sculptMasking: '遮罩 (-Ctrl)',
  sculptMove: '移动',
  sculptLocalScale: '局部缩放',
  sculptTransform: '变形 (E)',

  sculptCommon: '通用',
  sculptTool: '工具',
  sculptSymmetry: '对称',
  sculptContinuous: '连续',
  sculptRadius: '半径 (-X)',
  sculptIntensity: '强度 (-C)',
  sculptHardness: '硬度',
  sculptCulling: '薄曲面 (仅影响前面顶点)',
  sculptAlphaTitle: '透明色版 (Alpha)',
  sculptLockPositon: '锁定位置',
  sculptAlphaTex: '纹理',
  sculptImportAlpha: '导入 alpha 纹理 (jpg, png...)',
  sculptNegative: '反向 (N 或 -Alt)',
  sculptColor: '反照率',
  sculptRoughness: '粗糙度',
  sculptMetallic: '金属性',
  sculptClay: '黏土',
  sculptAccumulate: '累积 (每道笔划无限制)',
  sculptColorGlobal: '总体',
  sculptPickColor: '选择材质或颜色 (-S)',
  sculptTangentialSmoothing: '仅放松',
  sculptTopologicalCheck: '网面结构检查',
  sculptMoveAlongNormal: '沿法线方向移动 (N 或 -Alt)',
  sculptMaskingClear: '清除 (-Ctrl + 拖动)',
  sculptMaskingInvert: '反转 (-Ctrl + 点击)',
  sculptMaskingBlur: '模糊',
  sculptMaskingSharpen: '锐利化',
  sculptPBRTitle: 'PBR 材质',
  sculptPaintAll: '涂绘全部',
  sculptExtractTitle: '提取',
  sculptExtractThickness: '厚度',
  sculptExtractAction: '提取 !',

  // states
  stateTitle: '记录',
  stateUndo: '复原',
  stateRedo: '取消复原',
  stateMaxStack: '最大堆叠',

  // pressure
  pressureTitle: '感压绘图板',
  pressureRadius: '半径感压',
  pressureIntensity: '强度感压',

  // rendering
  renderingTitle: '图形绘算',
  renderingGrid: '显示格线',
  renderingSymmetryLine: '显示镜像线',
  renderingMatcap: '材质捕捉 (Matcap)',
  renderingCurvature: '曲率',
  renderingPBR: '物理式绘算(PBR)',
  renderingTransparency: '透明',
  renderingNormal: '法线着色器',
  renderingUV: 'UV 着色器',
  renderingShader: '着色器',
  renderingMaterial: '材质',
  renderingImportUV: '导入 (jpg, png...)',
  renderingImportMatcap: '导入 (jpg, png...)',
  renderingExtra: '额外',
  renderingFlat: '平整面',
  renderingWireframe: '线框 (W)',
  renderingExposure: '曝光',
  renderingEnvironment: '环境',
  renderingIsolate: '隔离/显示 (I)',
  renderingFilmic: '电影色调对应',

  // contour
  contour: '轮廓',
  contourShow: '显示轮廓',
  contourColor: '颜色',
  darkenUnselected: '未选取部分变暗',

  // pixel ratio
  resolution: '解析度',

  // matcaps
  matcapPearl: '珍珠',
  matcapClay: '黏土',
  matcapSkin: '膚色',
  matcapGreen: '綠色',
  matcapWhite: '白色',

  // sketchfab
  sketchfabTitle: '前往 Sketchfab !',
  sketchfabUpload: '上传',
  sketchfabUploadMessage: '请输入你的 sketchfab API 密钥.\n' +
    '你也可以不填写留下 "guest" 进行匿名上传。\n' +
    '(当上传中和完成时会跳出新窗口)',
  sketchfabUploadError: function (error) {
    return 'Sketchfab 上传错误 :\n' + error;
  },
  sketchfabUploadSuccess: '上传成功 !\n这是你的链接 :',
  sketchfabAbort: '中止最后上传的项目 ?',
  sketchfabUploadProcessing: '处理中...\n你的模型将会存放在：',

  about: '关于和说明',

  alphaNone: '无',
  alphaSquare: '方块',
  alphaSkin: '皮肤'
};

export default TR;
