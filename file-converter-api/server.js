// 加载环境变量
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// 配置CORS，确保允许所有源访问
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
}));
app.use(express.json());

// 配置上传目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成安全的文件名（时间戳 + 随机ID），避免中文或特殊字符问题
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const extension = path.extname(file.originalname);
    const safeFileName = `${timestamp}-${uniqueId}${extension}`;
    cb(null, safeFileName);
  }
});
const upload = multer({ storage });

// 内存中存储转换任务
const tasks = {};

// 文件上传并转换API
app.post('/api/convert', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    const sourceFile = req.file;
    const targetFormat = req.body.targetFormat || 'pdf';
    
    // 保存原始文件名
    const originalFileName = Buffer.from(sourceFile.originalname, 'latin1').toString('utf8');
    
    console.log('文件上传完成:', {
      originalFileName,
      path: sourceFile.path,
      size: sourceFile.size
    });
    
    // 创建转换后的文件名（简单复制原文件）
    const convertedFileName = sourceFile.filename;
    
    // 生成任务ID
    const jobId = uuidv4();
    
    // 存储任务信息
    tasks[jobId] = {
      originalFile: sourceFile.path,
      originalFileName: originalFileName,
      convertedFile: sourceFile.path, // 模拟场景，实际上应该是转换后的文件路径
      convertedFileName: convertedFileName,
      targetFormat,
      startTime: Date.now(),
      progress: 0
    };
    
    // 模拟后台处理
    simulateConversion(jobId);
    
    // 返回任务ID给前端
    res.json({
      success: true,
      jobId,
      message: '文件转换请求已提交，请稍后查询结果'
    });
    
  } catch (error) {
    console.error('转换过程出错:', error);
    res.status(500).json({
      success: false,
      error: '文件转换失败: ' + (error.message || '未知错误')
    });
  }
});

// 转换状态查询API
app.get('/api/conversion-status/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    if (!tasks[jobId]) {
      return res.status(404).json({
        success: false,
        error: '找不到转换任务'
      });
    }
    
    const task = tasks[jobId];
    
    // 计算已经过去的时间
    const elapsed = Date.now() - task.startTime;
    const simulatedDuration = 10000; // 10秒模拟转换时间
    
    // 计算进度 (0-100)
    const progress = Math.min(Math.floor((elapsed / simulatedDuration) * 100), 100);
    task.progress = progress;
    
    if (progress < 100) {
      // 仍在处理中
      res.json({
        success: true,
        status: 'processing',
        progress
      });
    } else {
      // 已完成
      const fileNameWithoutExt = task.originalFileName.substring(0, task.originalFileName.lastIndexOf('.')) || task.originalFileName;
      const downloadFileName = fileNameWithoutExt + '.' + task.targetFormat;
      
      console.log('转换完成:', {
        jobId,
        downloadFileName,
        originalFilePath: task.originalFile
      });
      
      // 转换已完成
      res.json({
        success: true,
        status: 'completed',
        downloadUrl: `/api/download/${jobId}?t=${Date.now()}`, // 添加时间戳避免缓存问题
        dataUrl: `/api/data-url/${jobId}`, // 新增：获取数据URI的API
        fileName: downloadFileName
      });
    }
    
  } catch (error) {
    console.error('查询状态出错:', error);
    res.status(500).json({
      success: false,
      error: '查询状态失败: ' + (error.message || '未知错误')
    });
  }
});

// 数据URI API - 将文件内容转换为Base64编码的数据URI
app.get('/api/data-url/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    console.log(`开始处理数据URI请求，jobId: ${jobId}`);
    
    if (!tasks[jobId]) {
      console.error(`找不到转换任务: ${jobId}`);
      return res.status(404).json({
        success: false,
        error: '找不到转换任务'
      });
    }
    
    const task = tasks[jobId];
    const filePath = task.originalFile;
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return res.status(404).json({
        success: false,
        error: '文件不存在或已被删除'
      });
    }
    
    // 获取文件信息
    const stats = fs.statSync(filePath);
    console.log(`文件存在，大小: ${stats.size} 字节，路径: ${filePath}`);
    
    // 大文件检查 - 避免处理过大的文件
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB限制
    if (stats.size > MAX_SIZE) {
      return res.status(413).json({
        success: false,
        error: '文件太大，无法通过数据URI方式下载，请使用常规下载方式'
      });
    }
    
    // 文件名处理
    const fileNameWithoutExt = task.originalFileName.substring(0, task.originalFileName.lastIndexOf('.')) || task.originalFileName;
    const downloadFileName = fileNameWithoutExt + '.' + task.targetFormat;
    
    // 读取文件并转换为Base64
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('读取文件失败:', err);
        return res.status(500).json({
          success: false,
          error: '读取文件失败: ' + err.message
        });
      }
      
      // 转换为Base64
      const base64Data = data.toString('base64');
      const mimeType = getMimeType(task.targetFormat);
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      // 创建下载HTML页面
      const downloadHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>下载 - ${downloadFileName}</title>
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f9f9f9;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            margin-bottom: 25px;
        }
        .download-btn {
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            margin-top: 15px;
            cursor: pointer;
            border: none;
            font-size: 16px;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <svg class="success-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="#4CAF50" />
            <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="8" fill="none" />
        </svg>
        <h1>文件转换成功</h1>
        <p>您的文件 "${downloadFileName}" 已准备好下载</p>
        <button class="download-btn" id="download-btn">点击下载文件</button>
    </div>
    
    <script>
        // 文件数据URI (注意: 大文件可能会导致页面加载缓慢)
        const dataUrl = "${dataUrl}";
        const fileName = "${downloadFileName}";
        
        // 下载按钮点击事件
        document.getElementById('download-btn').addEventListener('click', function() {
            // 创建下载链接
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = fileName;
            
            // 添加到页面并点击
            document.body.appendChild(link);
            link.click();
            
            // 移除链接
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
        });
        
        // 自动触发下载
        window.onload = function() {
            setTimeout(() => {
                document.getElementById('download-btn').click();
            }, 1000);
        };
    </script>
</body>
</html>
      `;
      
      // 返回HTML页面
      res.setHeader('Content-Type', 'text/html');
      res.send(downloadHtml);
      
    });
    
  } catch (error) {
    console.error('生成数据URI出错:', error);
    res.status(500).json({
      success: false,
      error: '生成数据URI失败: ' + (error.message || '未知错误')
    });
  }
});

// 获取小型文件的直接数据URL
app.get('/api/direct-data/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    if (!tasks[jobId]) {
      return res.status(404).json({
        success: false,
        error: '找不到转换任务'
      });
    }
    
    const task = tasks[jobId];
    const filePath = task.originalFile;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
    
    // 大小限制检查
    const stats = fs.statSync(filePath);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (stats.size > MAX_SIZE) {
      return res.status(413).json({
        success: false,
        error: '文件太大，请使用其他下载方式'
      });
    }
    
    // 读取并转换为Base64
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    const mimeType = getMimeType(task.targetFormat);
    
    // 返回数据URI
    res.json({
      success: true,
      fileName: task.originalFileName,
      mimeType: mimeType,
      dataUrl: `data:${mimeType};base64,${base64Data}`
    });
    
  } catch (error) {
    console.error('获取直接数据出错:', error);
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    });
  }
});

// 创建下载HTML页面API
app.get('/api/download-page/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    if (!tasks[jobId]) {
      return res.status(404).json({
        success: false,
        error: '找不到转换任务'
      });
    }
    
    // 生成下载HTML
    const downloadHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文件下载</title>
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f9f9f9;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            margin-bottom: 25px;
        }
        .download-btn {
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            margin: 8px;
        }
        .download-options {
            margin-top: 20px;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <svg class="success-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="#4CAF50" />
            <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="8" fill="none" />
        </svg>
        <h1>文件转换成功</h1>
        <p>请选择以下方式下载您的文件：</p>
        
        <div class="download-options">
            <a href="/api/data-url/${jobId}" class="download-btn" target="_blank">方式一：数据URL下载</a>
            <a href="/api/download/${jobId}" class="download-btn" target="_blank">方式二：普通下载</a>
            <a href="/api/simple-download/${jobId}" class="download-btn" target="_blank">方式三：简单下载</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px;">如果下载不成功，请尝试不同的下载方式</p>
    </div>
</body>
</html>
    `;
    
    // 返回HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(downloadHtml);
    
  } catch (error) {
    console.error('生成下载页面出错:', error);
    res.status(500).send('生成下载页面失败');
  }
});

// 简化的下载API
app.get('/api/download/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    console.log(`开始处理下载请求，jobId: ${jobId}`);
    
    if (!tasks[jobId]) {
      console.error(`找不到转换任务: ${jobId}`);
      return res.status(404).send('找不到转换任务');
    }
    
    const task = tasks[jobId];
    const filePath = task.originalFile;
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return res.status(404).send('文件不存在或已被删除');
    }
    
    // 获取文件大小
    const stats = fs.statSync(filePath);
    console.log(`文件存在，大小: ${stats.size} 字节，路径: ${filePath}`);
    
    // 文件名处理
    const fileNameWithoutExt = task.originalFileName.substring(0, task.originalFileName.lastIndexOf('.')) || task.originalFileName;
    const downloadFileName = fileNameWithoutExt + '.' + task.targetFormat;
    const encodedFileName = encodeURIComponent(downloadFileName);
    
    console.log(`准备下载文件: ${downloadFileName}`);
    
    // 设置更简单的响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"`);
    
    // 使用Express的标准下载方法
    res.download(filePath, downloadFileName, (err) => {
      if (err) {
        console.error('下载过程中出错:', err);
        if (!res.headersSent) {
          res.status(500).send('下载文件失败: ' + (err.message || '未知错误'));
        }
      }
    });
    
  } catch (error) {
    console.error('下载文件出错:', error);
    res.status(500).send('下载文件失败: ' + (error.message || '未知错误'));
  }
});

// 备用下载API - 使用最简单的方式
app.get('/api/simple-download/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    if (!tasks[jobId]) {
      return res.status(404).send('找不到转换任务');
    }
    
    const task = tasks[jobId];
    const filePath = task.originalFile;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('文件不存在');
    }
    
    // 直接发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('发送文件失败:', err);
      }
    });
    
  } catch (error) {
    console.error('简单下载出错:', error);
    res.status(500).send('下载失败');
  }
});

// 测试API - 返回所有可用API路径
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    apis: [
      '/api/convert - 上传并转换文件',
      '/api/conversion-status/:jobId - 查询转换状态',
      '/api/download/:jobId - 下载文件',
      '/api/simple-download/:jobId - 简单下载文件',
      '/api/data-url/:jobId - 获取数据URI形式的文件',
      '/api/direct-data/:jobId - 获取文件的数据URL',
      '/api/download-page/:jobId - 获取多种下载选项的页面',
      '/api/test - 当前API'
    ]
  });
});

// 获取MIME类型
function getMimeType(format) {
  const mimeTypes = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'txt': 'text/plain'
  };
  
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
}

// 模拟转换过程
function simulateConversion(jobId) {
  const task = tasks[jobId];
  const interval = setInterval(() => {
    const elapsed = Date.now() - task.startTime;
    const simulatedDuration = 10000; // 10秒模拟转换时间
    
    // 更新进度
    const progress = Math.min(Math.floor((elapsed / simulatedDuration) * 100), 100);
    task.progress = progress;
    
    // 如果完成，清除定时器
    if (progress >= 100) {
      clearInterval(interval);
      console.log(`任务 ${jobId} 转换完成`);
    }
  }, 500);
}

app.listen(port, () => {
  console.log(`模拟文件转换服务运行在 http://localhost:${port}`);
  console.log(`上传目录: ${uploadDir}`);
  console.log(`使用API测试: http://localhost:${port}/api/test`);
}); 