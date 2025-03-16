// 图片格式转换工具 - 连接到后端API
document.addEventListener('DOMContentLoaded', function() {
    console.log('图片转换器脚本加载');
    
    // API端点配置 - 指向后端服务器
    const API_ENDPOINT = 'http://localhost:5000/api';  // 使用完整的URL
    
    // 获取DOM元素
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const selectedImages = document.getElementById('selected-images');
    const removeFilesBtn = document.getElementById('remove-files');
    const conversionOptions = document.getElementById('conversion-options');
    const convertBtn = document.getElementById('convert-button');
    const conversionProgress = document.getElementById('conversion-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const conversionResult = document.getElementById('conversion-result');
    const resultFiles = document.getElementById('result-files');
    const downloadAllBtn = document.getElementById('download-all-button');
    const convertNewBtn = document.getElementById('convert-new-button');
    const imageQuality = document.getElementById('image-quality');
    const qualityValue = document.getElementById('quality-value');
    
    // 水印相关元素
    const watermarkText = document.getElementById('watermark-text');
    const watermarkOpacity = document.getElementById('watermark-opacity');
    const opacityValue = document.getElementById('opacity-value');
    
    // 旋转角度相关元素
    const rotationSlider = document.getElementById('watermark-rotation');
    const rotationValue = document.getElementById('rotation-value');
    
    // 确保基本元素存在
    if (!uploadArea || !fileInput) {
        console.error('找不到基本上传元素');
        return;
    }
    
    // 当前选择的文件和转换任务ID
    let selectedFileList = [];
    let convertedFiles = [];
    let currentJobId = null;
    
    // 添加拖放功能
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    // 文件选择处理
    fileInput.addEventListener('change', function(event) {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });
    
    // 处理选择的图片文件
    function handleFiles(files) {
        resetUI();
        selectedFileList = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (selectedFileList.length === 0) {
            showNotification('请选择有效的图片文件', 'error');
            return;
        }
        
        // 显示已选择的图片
        updateFileInfo();
    }
    
    // 更新文件信息显示
    function updateFileInfo() {
        selectedImages.innerHTML = '';
        
        selectedFileList.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="image-name">${file.name}</div>
                    <button class="remove-image" data-index="${index}">×</button>
                `;
                selectedImages.appendChild(preview);
                
                // 添加单个图片删除功能
                preview.querySelector('.remove-image').addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(this.getAttribute('data-index'));
                    removeImage(index);
                });
            };
            
            reader.readAsDataURL(file);
        });
        
        if (selectedFileList.length > 0) {
            fileInfo.classList.remove('hidden');
            conversionOptions.classList.remove('hidden');
        } else {
            fileInfo.classList.add('hidden');
            conversionOptions.classList.add('hidden');
        }
    }
    
    // 移除单个图片
    function removeImage(index) {
        selectedFileList.splice(index, 1);
        updateFileInfo();
    }
    
    // 移除所有图片
    removeFilesBtn.addEventListener('click', function() {
        selectedFileList = [];
        fileInput.value = '';
        updateFileInfo();
    });
    
    // 处理质量滑块变化
    if (imageQuality) {
        imageQuality.addEventListener('input', function() {
            qualityValue.textContent = `${imageQuality.value}%`;
        });
    }
    
    // 处理透明度滑块变化
    if (watermarkOpacity) {
        watermarkOpacity.addEventListener('input', function() {
            opacityValue.textContent = `${watermarkOpacity.value}%`;
        });
    }
    
    // 处理旋转角度滑块变化
    if (rotationSlider) {
        rotationSlider.addEventListener('input', function() {
            rotationValue.textContent = `${rotationSlider.value}°`;
        });
    }
    
    // 处理水印位置选择
    const positionOptions = document.querySelectorAll('.position-option');
    positionOptions.forEach(option => {
        option.addEventListener('click', function() {
            positionOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input').checked = true;
        });
    });
    
    // 转换按钮点击
    convertBtn.addEventListener('click', function() {
        if (selectedFileList.length === 0) {
            showNotification('请先选择图片文件', 'error');
            return;
        }
        
        // 获取选择的目标格式
        const formatRadios = document.querySelectorAll('input[name="target-format"]');
        let targetFormat = 'jpg'; // 默认格式
        
        formatRadios.forEach(radio => {
            if (radio.checked) {
                targetFormat = radio.value;
            }
        });
        
        // 获取质量设置
        const quality = imageQuality.value;
        
        // 获取水印设置
        const watermarkText = document.getElementById('watermark-text').value.replace(/\n/g, '\\n');
        const watermarkPosition = document.querySelector('input[name="watermark-position"]:checked').value;
        const watermarkOpacity = document.getElementById('watermark-opacity').value;
        const watermarkRotation = document.getElementById('watermark-rotation').value;
        
        // 开始转换
        startConversion(targetFormat, quality, watermarkText, watermarkPosition, watermarkOpacity, watermarkRotation);
    });
    
    // 开始转换过程
    function startConversion(format, quality, watermarkText, watermarkPosition, watermarkOpacity, watermarkRotation) {
        showProgress(0, '准备转换...');
        
        const formData = new FormData();
        
        // 添加所有选择的文件
        selectedFileList.forEach(file => {
            formData.append('files', file);
        });
        
        // 添加转换参数
        formData.append('format', format);
        formData.append('quality', quality);
        
        // 添加水印参数
        if (watermarkText.trim()) {
            formData.append('watermarkText', watermarkText);
            formData.append('watermarkPosition', watermarkPosition);
            formData.append('watermarkOpacity', watermarkOpacity);
            formData.append('watermarkRotation', watermarkRotation);
        }
        
        console.log('开始发送转换请求...');
        console.log('目标格式:', format);
        console.log('图片质量:', quality);
        console.log('选择的文件数量:', selectedFileList.length);
        
        // 发送转换请求
        fetch(`${API_ENDPOINT}/image/convert`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('服务器响应状态:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('服务器错误响应:', text);
                    throw new Error(`转换请求失败 (${response.status}): ${text || '未知错误'}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('转换任务创建成功', data);
            currentJobId = data.jobId;
            
            // 显示进度并开始检查状态
            checkConversionStatus();
        })
        .catch(error => {
            console.error('转换请求出错:', error);
            
            // 检查是否是网络错误或后端未启动
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                showNotification(`
                    无法连接到后端服务器，请确保服务器已启动。
                    <a href="debug.html" style="color: white; text-decoration: underline;">点击这里进行调试</a>
                `, 'error', 10000);
            } else {
                // 显示特定错误
                showNotification(`
                    转换请求失败: ${error.message}
                    <a href="debug.html" style="color: white; text-decoration: underline;">点击这里进行调试</a>
                `, 'error', 10000);
            }
            
            resetUI();
        });
    }
    
    // 检查转换进度
    function checkConversionStatus() {
        if (!currentJobId) return;
        
        console.log('检查转换状态，任务ID:', currentJobId);
        
        fetch(`${API_ENDPOINT}/image/status/${currentJobId}`)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`获取状态失败 (${response.status}): ${text || '未知错误'}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('获取到转换状态:', data);
                const { status, progress, result } = data;
                
                if (status === 'processing') {
                    // 更新进度
                    showProgress(progress, `${progress}%`);
                    // 继续检查
                    setTimeout(checkConversionStatus, 1000);
                } else if (status === 'completed') {
                    // 显示转换完成
                    showProgress(100, '已完成');
                    // 记录转换后的文件
                    convertedFiles = result.files;
                    // 显示转换结果
                    showConversionResult(result.files);
                } else if (status === 'failed') {
                    // 显示错误
                    showNotification('转换失败: ' + (data.error || '未知错误'), 'error');
                    resetUI();
                }
            })
            .catch(error => {
                console.error('检查状态出错:', error);
                showNotification(`检查转换状态失败: ${error.message}`, 'error');
                resetUI();
            });
    }
    
    // 显示进度
    function showProgress(percent, text) {
        fileInfo.classList.add('hidden');
        conversionOptions.classList.add('hidden');
        conversionProgress.classList.remove('hidden');
        
        progressFill.style.width = `${percent}%`;
        progressText.textContent = text;
    }
    
    // 显示转换结果
    function showConversionResult(files) {
        conversionProgress.classList.add('hidden');
        conversionResult.classList.remove('hidden');
        
        resultFiles.innerHTML = '';
        
        files.forEach(file => {
            const resultFile = document.createElement('div');
            resultFile.className = 'result-file';
            
            // 修改URL处理逻辑
            const imgUrl = file.url;
            const fullImgUrl = `http://localhost:5000${imgUrl}`;
            
            resultFile.innerHTML = `
                <img src="${fullImgUrl}" alt="${file.name}" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23ccc\' d=\'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z\'/%3E%3C/svg%3E';">
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatSize(file.size)}</div>
                </div>
            `;
            resultFiles.appendChild(resultFile);
            
            // 修改下载处理逻辑
            resultFile.addEventListener('click', function() {
                const downloadUrl = `http://localhost:5000${file.url}`;
                window.open(downloadUrl, '_blank');
            });
        });
        
        // 下载全部按钮
        downloadAllBtn.removeEventListener('click', downloadAllFiles);
        downloadAllBtn.addEventListener('click', downloadAllFiles);
        
        // 转换新文件按钮
        convertNewBtn.removeEventListener('click', resetUI);
        convertNewBtn.addEventListener('click', resetUI);
    }
    
    // 修改下载文件函数
    function downloadFile(url, filename) {
        // 确保使用完整的URL
        const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
        
        console.log('下载文件:', fullUrl);
        
        // 使用window.open在新标签页打开文件
        window.open(fullUrl, '_blank');
    }
    
    // 下载所有文件
    function downloadAllFiles() {
        if (convertedFiles.length === 0) return;
        
        // 如果只有一个文件，直接下载
        if (convertedFiles.length === 1) {
            downloadFile(convertedFiles[0].url, convertedFiles[0].name);
            return;
        }
        
        // 如果有多个文件，请求后端创建ZIP包
        fetch(`${API_ENDPOINT}/image/download-all/${currentJobId}`)
            .then(response => {
                if (!response.ok) throw new Error('创建下载包失败');
                return response.json();
            })
            .then(data => {
                downloadFile(data.zipUrl, '转换后的图片.zip');
            })
            .catch(error => {
                console.error('下载所有文件出错:', error);
                showNotification('创建下载包失败，请尝试单独下载', 'error');
            });
    }
    
    // 重置UI到初始状态
    function resetUI() {
        fileInfo.classList.add('hidden');
        conversionOptions.classList.add('hidden');
        conversionProgress.classList.add('hidden');
        conversionResult.classList.add('hidden');
        
        // 清除当前任务
        currentJobId = null;
        convertedFiles = [];
        
        // 显示上传区域
        uploadArea.classList.remove('hidden');
    }
    
    // 显示通知消息
    function showNotification(message, type = 'info', duration = 5000) {
        // 检查是否已有通知，如果有则移除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 创建新通知
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
                <button class="close-btn">关闭</button>
            </div>
        `;
        
        // 添加通知样式
        if (!document.querySelector('#notification-style')) {
            const style = document.createElement('style');
            style.id = 'notification-style';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    transform: translateX(100%);
                    opacity: 0;
                    max-width: 350px;
                }
                
                .notification.info {
                    background-color: #3474D4;
                    color: white;
                }
                
                .notification.error {
                    background-color: #E74C3C;
                    color: white;
                }
                
                .notification.success {
                    background-color: #47B881;
                    color: white;
                }
                
                .notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .notification-content p {
                    flex: 1;
                    margin: 0;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                    flex-shrink: 0;
                }
                
                .close-btn:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 添加通知到页面
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 添加关闭按钮
        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // 自动隐藏通知
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }
    
    // 文件大小格式化
    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 测试API连接
    async function testAPIConnection() {
        try {
            const response = await fetch('http://localhost:5000/api/image/status/test');
            const data = await response.json();
            console.log('API连接测试成功:', data);
            return true;
        } catch (error) {
            console.error('API连接测试失败:', error);
            return false;
        }
    }

    // 在页面加载时测试连接
    document.addEventListener('DOMContentLoaded', async function() {
        const isConnected = await testAPIConnection();
        if (!isConnected) {
            showNotification(`
                无法连接到后端服务器，请确保服务器已启动。
                <br><br>
                <a href="debug.html" style="color: white; text-decoration: underline;">点击这里进行调试</a>
                <br><br>
                <button onclick="testAPIConnection()" style="background: white; color: #E74C3C; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">重试连接</button>
            `, 'error', 0);
        }
    });

    // 修改API调用函数
    async function callAPI(endpoint, data = null, method = 'GET') {
        try {
            const options = {
                method: method,
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors',  // 启用CORS
            };

            if (data) {
                if (data instanceof FormData) {
                    options.body = data;
                } else {
                    options.headers['Content-Type'] = 'application/json';
                    options.body = JSON.stringify(data);
                }
            }

            const response = await fetch(`${API_ENDPOINT}${endpoint}`, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}); 