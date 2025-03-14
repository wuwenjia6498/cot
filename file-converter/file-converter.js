// 文件格式转换工具 - 连接到安全的后端API
document.addEventListener('DOMContentLoaded', function() {
    console.log('文件转换器脚本加载');
    
    // API端点配置 - 指向您的后端服务器
    const API_ENDPOINT = 'http://localhost:3000'; // 部署时改为您的服务器地址
    
    // 获取DOM元素
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const removeFileBtn = document.getElementById('remove-file');
    const conversionOptions = document.getElementById('conversion-options');
    const convertBtn = document.getElementById('convert-button');
    const targetFormat = document.getElementById('target-format');
    const conversionProgress = document.getElementById('conversion-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const conversionResult = document.getElementById('conversion-result');
    const convertedFileName = document.getElementById('converted-file-name');
    const convertedFileSize = document.getElementById('converted-file-size');
    const downloadBtn = document.getElementById('download-button');
    const convertNewBtn = document.getElementById('convert-new-button');
    
    // 确保基本元素存在
    if (!uploadArea || !fileInput) {
        console.error('找不到基本上传元素');
        return;
    }
    
    // 当前选择的文件和转换任务ID
    let currentFile = null;
    let currentJobId = null;
    let downloadUrl = null;
    
    // 文件选择处理
    fileInput.addEventListener('change', function(event) {
        try {
            if (fileInput.files.length > 0) {
                currentFile = fileInput.files[0];
                console.log('选择的文件:', currentFile.name);
                
                // 显示文件信息
                if (fileName && fileSize) {
                    fileName.textContent = currentFile.name;
                    fileSize.textContent = formatSize(currentFile.size);
                }
                
                // 显示/隐藏相关区域
                if (uploadArea) uploadArea.className = 'upload-area hidden';
                if (fileInfo) fileInfo.className = 'selected-file-info';
                if (conversionOptions) conversionOptions.className = 'conversion-options';
            }
        } catch (error) {
            console.error('文件选择处理出错:', error);
            alert('处理文件时出错，请重试');
        }
    });
    
    // 删除文件按钮
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function() {
            try {
                // 清空文件输入
                fileInput.value = '';
                currentFile = null;
                currentJobId = null;
                downloadUrl = null;
                
                // 重置界面
                resetUI();
            } catch (error) {
                console.error('移除文件出错:', error);
            }
        });
    }
    
    // 转换按钮事件
    if (convertBtn) {
        convertBtn.addEventListener('click', function() {
            try {
                if (!currentFile) {
                    alert('请先选择文件');
                    return;
                }
                
                // 获取选择的格式
                const format = targetFormat ? targetFormat.value : 'pdf';
                console.log('开始转换为:', format);
                
                // 显示进度条
                showProgress(0, '准备转换...');
                
                // 创建FormData对象
                const formData = new FormData();
                formData.append('file', currentFile);
                formData.append('targetFormat', format);
                
                // 发送文件到中间层API
                fetch(`${API_ENDPOINT}/api/convert`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        currentJobId = data.jobId;
                        console.log('转换任务已提交，JobID:', currentJobId);
                        
                        // 开始轮询检查转换状态
                        checkConversionStatus();
                    } else {
                        throw new Error(data.error || '提交转换任务失败');
                    }
                })
                .catch(error => {
                    console.error('API调用出错:', error);
                    alert('提交转换任务失败: ' + error.message);
                    
                    // 恢复界面
                    if (conversionOptions) conversionOptions.className = 'conversion-options';
                    if (conversionProgress) conversionProgress.className = 'conversion-progress hidden';
                });
            } catch (error) {
                console.error('转换处理出错:', error);
                alert('转换过程中出错，请重试');
            }
        });
    }
    
    // 显示进度条
    function showProgress(percent, text) {
        if (conversionOptions) conversionOptions.className = 'conversion-options hidden';
        if (conversionProgress) conversionProgress.className = 'conversion-progress';
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressText) progressText.textContent = text || `正在转换... ${Math.round(percent)}%`;
    }
    
    // 检查转换状态
    function checkConversionStatus() {
        if (!currentJobId) return;
        
        fetch(`${API_ENDPOINT}/api/conversion-status/${currentJobId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.status === 'processing') {
                        // 更新进度
                        const progress = data.progress || 0;
                        showProgress(progress);
                        
                        // 继续轮询，每2秒检查一次
                        setTimeout(checkConversionStatus, 2000);
                    } else if (data.status === 'completed') {
                        // 转换完成
                        downloadUrl = data.downloadUrl;
                        showConversionResult(data.fileName);
                    }
                } else {
                    // 转换失败
                    showError('转换失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('检查状态出错:', error);
                showError('检查转换状态失败: ' + error.message);
            });
    }
    
    // 显示错误
    function showError(message) {
        alert(message);
        
        // 恢复界面状态
        if (conversionOptions) conversionOptions.className = 'conversion-options';
        if (conversionProgress) conversionProgress.className = 'conversion-progress hidden';
    }
    
    // 显示转换结果
    function showConversionResult(convertedName) {
        try {
            if (conversionProgress) conversionProgress.className = 'conversion-progress hidden';
            if (conversionResult) conversionResult.className = 'conversion-result';
            
            // 设置转换后的文件信息
            if (convertedFileName) convertedFileName.textContent = convertedName || '已转换的文件';
            if (convertedFileSize) convertedFileSize.textContent = '点击下载查看';
        } catch (error) {
            console.error('显示结果出错:', error);
        }
    }
    
    // 下载按钮
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            try {
                if (!downloadUrl) {
                    alert('下载链接不可用，请重试');
                    return;
                }
                
                // 打开下载链接
                window.open(downloadUrl, '_blank');
            } catch (error) {
                console.error('下载出错:', error);
                alert('文件下载失败，请重试');
            }
        });
    }
    
    // 转换新文件按钮
    if (convertNewBtn) {
        convertNewBtn.addEventListener('click', function() {
            try {
                // 清空文件输入
                fileInput.value = '';
                currentFile = null;
                currentJobId = null;
                downloadUrl = null;
                
                // 重置界面
                resetUI();
            } catch (error) {
                console.error('重置界面出错:', error);
            }
        });
    }
    
    // 重置UI状态
    function resetUI() {
        if (uploadArea) uploadArea.className = 'upload-area';
        if (fileInfo) fileInfo.className = 'selected-file-info hidden';
        if (conversionOptions) conversionOptions.className = 'conversion-options hidden';
        if (conversionProgress) conversionProgress.className = 'conversion-progress hidden';
        if (conversionResult) conversionResult.className = 'conversion-result hidden';
    }
    
    // 文件大小格式化
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
});