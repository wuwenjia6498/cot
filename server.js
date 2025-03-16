const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const OSS = require('ali-oss');
const Core = require('@alicloud/pop-core');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(express.json());

// 确保public目录存在
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// 使用静态文件服务
app.use(express.static('public'));

// 一个丰富的名言数据库
const quotes = [
    { text: "把事情做对很重要，但把正确的事情做更重要。", author: "彼得·德鲁克" },
    { text: "简单是最终的复杂。", author: "达芬奇" },
    { text: "优秀的设计是让复杂的东西变得简单。", author: "乔布斯" },
    { text: "创新不在于技术，而在于思考方式。", author: "爱因斯坦" },
    { text: "不要追求完美，要追求进步。", author: "李小龙" },
    { text: "勇气不是没有恐惧，而是战胜恐惧。", author: "纳尔逊·曼德拉" },
    { text: "行动是治愈恐惧的良药。", author: "威廉·詹姆斯" },
    { text: "没有伟大的梦想，就不会有伟大的工程。", author: "茅以升" },
    { text: "学习不是为了知道更多，而是为了做得更好。", author: "德鲁克" },
    { text: "态度决定高度，细节决定成败。", author: "稻盛和夫" },
    { text: "没有退路时，潜能就会发挥出来。", author: "撒切尔夫人" },
    { text: "最困难的时刻，也是离成功最近的时刻。", author: "拿破仑·希尔" },
    { text: "眼中没有障碍，心中就没有困难。", author: "海伦·凯勒" },
    { text: "成功不是将来才有的，而是从决定去做的那一刻起，持续累积而成。", author: "佚名" }
];

// 获取随机名言的API
app.get('/api/quote', (req, res) => {
    try {
        // 随机选择一条名言
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        // 添加300ms的延迟模拟网络请求
        setTimeout(() => {
            res.json({
                success: true,
                data: randomQuote
            });
        }, 300);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: '获取名言失败'
        });
    }
});

// 添加API测试路由
app.get('/api/test', (req, res) => {
    res.json({ message: 'API服务正常工作' });
});

// 配置文件上传
const upload = multer({
  dest: 'uploads/'
});

// 创建uploads目录（如果不存在）
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 配置阿里云 OSS 客户端
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
});

// 配置阿里云文档转换服务客户端
const docConvertClient = new Core({
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  endpoint: process.env.DOCCONVERT_ENDPOINT,
  apiVersion: process.env.DOCCONVERT_API_VERSION
});

// 任务存储对象
const tasks = {};

// 模拟文件转换过程
function simulateConversion(jobId) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    if (progress > 100) {
      clearInterval(interval);
      progress = 100;
      tasks[jobId].status = 'completed';
      tasks[jobId].progress = 100;
      console.log(`任务 ${jobId} 已完成`);
      return;
    }
    tasks[jobId].progress = progress;
    tasks[jobId].status = progress < 100 ? 'processing' : 'completed';
  }, 800); // 每0.8秒更新一次进度
}

// 添加状态查询API
app.get('/api/conversion-status/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const task = tasks[jobId];
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: '任务不存在'
    });
  }
  
  res.json({
    success: true,
    status: task.status || 'processing',
    progress: task.progress || 0,
    originalFileName: task.originalFileName,
    targetFormat: task.targetFormat,
    downloadUrl: `/api/download/${task.convertedFileName}`
  });
});

// 添加下载页面API
app.get('/api/download-page/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const task = tasks[jobId];
  
  if (!task) {
    return res.status(404).send('任务不存在');
  }
  
  // 生成下载页面内容
  const downloadPageHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>文件下载</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "SF Pro", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        
        body {
          background-color: #f5f5f7;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 30px;
          width: 100%;
          max-width: 560px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }
        
        h1 {
          font-size: 24px;
          color: #1d1d1f;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .download-method {
          margin-bottom: 25px;
          padding: 15px;
          border-radius: 8px;
          background-color: #f5f5f7;
        }
        
        .download-method h2 {
          font-size: 18px;
          color: #1d1d1f;
          margin-bottom: 10px;
        }
        
        .download-btn {
          display: inline-block;
          background-color: #0071e3;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          text-decoration: none;
          font-size: 14px;
          margin-top: 10px;
          transition: all 0.2s;
        }
        
        .download-btn:hover {
          background-color: #0062cc;
        }
        
        .file-info {
          margin-bottom: 20px;
        }
        
        .file-info p {
          margin-bottom: 5px;
          color: #6e6e73;
        }
        
        .file-info strong {
          color: #1d1d1f;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>文件下载</h1>
        
        <div class="file-info">
          <p>原始文件: <strong>${task.originalFileName}</strong></p>
          <p>目标格式: <strong>${task.targetFormat}</strong></p>
          <p>处理状态: <strong>${task.status === 'completed' ? '已完成' : '处理中'}</strong></p>
        </div>
        
        <div class="download-method">
          <h2>方式一：直接下载</h2>
          <p>点击下方按钮直接下载转换后的文件</p>
          <a href="/api/download/${task.convertedFileName}" class="download-btn" download>下载文件</a>
        </div>
        
        <div class="download-method">
          <h2>方式二：API获取</h2>
          <p>使用此链接可以通过API获取文件数据</p>
          <a href="/api/data-url/${jobId}" class="download-btn" target="_blank">获取数据URL</a>
        </div>
        
        <div class="download-method">
          <h2>方式三：简单下载</h2>
          <p>如果其他方式不工作，请尝试此备用链接</p>
          <a href="/api/simple-download/${jobId}" class="download-btn">备用下载</a>
        </div>
        
        <div class="download-method">
          <h2>方式四：直接下载</h2>
          <p>使用浏览器直接处理的下载方式</p>
          <a href="/api/direct-data/${jobId}" class="download-btn" download="${task.originalFileName}">直接下载</a>
        </div>
      </div>
    </body>
    </html>
  `;
  
  res.send(downloadPageHtml);
});

// 添加API获取数据链接
app.get('/api/data-url/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const task = tasks[jobId];
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: '任务不存在'
    });
  }
  
  res.json({
    success: true,
    apis: [
      `/api/convert - 上传并转换文件`,
      `/api/conversion-status/:jobId - 查询转换状态`,
      `/api/download/:jobId - 下载文件`,
      `/api/simple-download/:jobId - 简单下载方式`,
      `/api/data-url/:jobId - 获取数据URL链接`,
      `/api/direct-data/:jobId - 获取文件的数据URL`,
      `/api/download-page/:jobId - 完整下载页面`,
      `/api/test - 测试API`
    ]
  });
});

// 添加简单下载API
app.get('/api/simple-download/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const task = tasks[jobId];
  
  if (!task) {
    return res.status(404).send('任务不存在');
  }
  
  // 直接发送文件
  res.sendFile(path.resolve(task.convertedFile));
});

// 添加直接数据API
app.get('/api/direct-data/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const task = tasks[jobId];
  
  if (!task) {
    return res.status(404).send('任务不存在');
  }
  
  // 读取文件内容
  fs.readFile(task.convertedFile, (err, data) => {
    if (err) {
      return res.status(500).send('读取文件失败');
    }
    
    // 设置文件头信息
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(task.originalFileName)}"`);
    res.setHeader('Content-Length', data.length);
    
    // 发送文件内容
    res.send(data);
  });
});

// 修改简化版文件转换API
app.post('/api/convert', upload.single('file'), (req, res) => {
  try {
    // 确保文件上传成功
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有接收到文件'
      });
    }
    
    // 获取服务器基础URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    // 获取文件信息
    const sourceFile = req.file;
    const targetFormat = req.body.format || 'pdf'; // 默认转为PDF
    
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

// 修改下载API，使其正确处理Content-Type和文件名
app.get('/api/download/:fileId', (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, 'uploads', fileId);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('文件不存在');
    }
    
    // 获取原始文件信息
    const stat = fs.statSync(filePath);
    const originalFile = req.file; // 可能是undefined，需要处理

    // 设置正确的Content-Type和Content-Length头
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream'); // 通用二进制流

    // 设置文件下载头 - 确保文件名正确编码
    const safeFilename = encodeURIComponent("converted_file" + Date.now() + ".doc");
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    
    // 创建文件读取流并发送
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).send('下载文件失败: ' + error.message);
  }
});

// 添加根路由处理
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API测试: http://localhost:${PORT}/api/test`);
    console.log(`名言API: http://localhost:${PORT}/api/quote`);
}); 