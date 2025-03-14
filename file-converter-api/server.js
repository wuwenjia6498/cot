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

// 启用CORS，允许前端访问
app.use(cors());
app.use(express.json());

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// 模拟任务状态存储
const tasks = {};

// 文件上传并转换API
app.post('/api/convert', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    const sourceFile = req.file;
    const targetFormat = req.body.targetFormat || 'pdf';
    
    // 生成任务ID
    const jobId = uuidv4();
    
    // 存储任务信息
    tasks[jobId] = {
      file: sourceFile.path,
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
      const downloadFileName = path.basename(task.file).replace(/\.[^.]+$/, '') + '.' + task.targetFormat;
      
      // 转换已完成
      res.json({
        success: true,
        status: 'completed',
        downloadUrl: `/api/download/${jobId}`,
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

// 下载API
app.get('/api/download/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    if (!tasks[jobId]) {
      return res.status(404).json({
        success: false,
        error: '找不到转换任务'
      });
    }
    
    const task = tasks[jobId];
    const originalFile = task.file;
    const targetFormat = task.targetFormat;
    
    // 为演示目的，直接返回原文件
    // 实际应用中，这里应返回转换后的文件
    const fileName = path.basename(originalFile).replace(/\.[^.]+$/, '') + '.' + targetFormat;
    
    res.download(originalFile, fileName);
    
  } catch (error) {
    console.error('下载文件出错:', error);
    res.status(500).json({
      success: false,
      error: '下载文件失败: ' + (error.message || '未知错误')
    });
  }
});

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
    }
  }, 500);
}

app.listen(port, () => {
  console.log(`模拟文件转换服务运行在 http://localhost:${port}`);
}); 