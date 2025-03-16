/**
 * 二维码工具脚本
 * 实现二维码的生成和解析功能
 */

// DOM元素
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const qrContentInput = document.getElementById('qr-content');
const qrSizeSelect = document.getElementById('qr-size');
const qrFgColorInput = document.getElementById('qr-fg-color');
const qrBgColorInput = document.getElementById('qr-bg-color');
const errorCorrectionSelect = document.getElementById('error-correction');
const logoFileInput = document.getElementById('logo-file');
const removeLogoBtn = document.getElementById('remove-logo');
const generateBtn = document.getElementById('generate-btn');
const qrcodeResult = document.getElementById('qrcode-result');
const qrcodeDisplay = document.getElementById('qrcode-display');
const resultActions = document.querySelector('.result-actions');
const emptyState = document.querySelector('.empty-state');
const downloadPngBtn = document.getElementById('download-png');
const downloadSvgBtn = document.getElementById('download-svg');
const downloadPdfBtn = document.getElementById('download-pdf');
const qrScanFileInput = document.getElementById('qr-scan-file');
const uploadWrapper = document.getElementById('upload-wrapper');
const scanResult = document.getElementById('scan-result');
const resultContent = document.getElementById('result-content');
const resultType = document.getElementById('result-type');
const copyResultBtn = document.getElementById('copy-result');
const openLinkBtn = document.getElementById('open-link');
const startCameraBtn = document.getElementById('start-camera');
const closeCameraBtn = document.getElementById('close-camera');
const cameraContainer = document.getElementById('camera-container');
const cameraPreview = document.getElementById('camera-preview');

// 全局变量
let logoImage = null;
let qrCodeInstance = null;
let videoStream = null;
let scanInterval = null;
let logoReady = false; // 标记Logo是否已准备好

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化二维码工具');
    
    // 初始化标签页切换
    initTabs();
    
    // 初始化生成二维码功能
    initQRCodeGenerator();
    
    // 初始化解析二维码功能
    initQRCodeScanner();

    // 检查下载按钮的DOM元素
    console.log('下载按钮状态:', {
        pngBtn: !!downloadPngBtn,
        svgBtn: !!downloadSvgBtn,
        pdfBtn: !!downloadPdfBtn
    });
});

/**
 * 初始化标签页切换功能
 */
function initTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有标签页和内容的active类
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // 激活当前标签页和对应内容
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}-panel`).classList.add('active');
            
            // 如果切换到扫描标签页，停止摄像头
            if (tabId !== 'scan' && videoStream) {
                stopCamera();
            }
        });
    });
}

/**
 * 初始化二维码生成功能
 */
function initQRCodeGenerator() {
    console.log('初始化二维码生成功能');
    
    // 颜色选择器实时预览
    qrFgColorInput.addEventListener('input', updateColorPreview);
    qrBgColorInput.addEventListener('input', updateColorPreview);
    
    // 初始化颜色预览
    updateColorPreview();
    
    // Logo上传处理
    logoFileInput.addEventListener('change', handleLogoUpload);
    removeLogoBtn.addEventListener('click', removeLogo);
    
    // 生成二维码按钮点击事件
    generateBtn.addEventListener('click', generateQRCode);
    console.log('已绑定生成按钮点击事件');
    
    // 下载按钮事件
    downloadPngBtn.addEventListener('click', function() {
        console.log('点击下载PNG按钮');
        downloadQRCode('png');
    });
    
    downloadSvgBtn.addEventListener('click', function() {
        console.log('点击下载SVG按钮');
        downloadQRCode('svg');
    });
    
    downloadPdfBtn.addEventListener('click', function() {
        console.log('点击下载PDF按钮');
        downloadQRCode('pdf');
    });
    
    console.log('已绑定下载按钮事件');
}

/**
 * 更新颜色预览
 */
function updateColorPreview() {
    // 如果颜色选择器旁边没有预览元素，则创建
    createColorPreviewIfNeeded(qrFgColorInput, '前景色');
    createColorPreviewIfNeeded(qrBgColorInput, '背景色');
}

/**
 * 为颜色选择器创建预览元素
 */
function createColorPreviewIfNeeded(colorInput, labelText) {
    const parentElement = colorInput.parentElement;
    let previewElement = parentElement.querySelector('.color-preview');
    
    if (!previewElement) {
        // 创建颜色预览元素
        const previewContainer = document.createElement('div');
        previewContainer.className = 'color-preview-container';
        previewContainer.style.display = 'flex';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.marginTop = '8px';
        
        previewElement = document.createElement('div');
        previewElement.className = 'color-preview';
        previewElement.style.width = '24px';
        previewElement.style.height = '24px';
        previewElement.style.borderRadius = '4px';
        previewElement.style.border = '1px solid #d2d2d7';
        previewElement.style.marginRight = '8px';
        
        const previewText = document.createElement('span');
        previewText.textContent = `已选${labelText}: `;
        previewText.style.fontSize = '0.9rem';
        previewText.style.color = '#86868b';
        
        const colorCode = document.createElement('span');
        colorCode.className = 'color-code';
        colorCode.style.fontSize = '0.9rem';
        colorCode.style.fontFamily = 'monospace';
        
        previewContainer.appendChild(previewText);
        previewContainer.appendChild(previewElement);
        previewContainer.appendChild(colorCode);
        parentElement.appendChild(previewContainer);
    }
    
    // 更新预览颜色
    previewElement.style.backgroundColor = colorInput.value;
    const colorCode = parentElement.querySelector('.color-code');
    if (colorCode) {
        colorCode.textContent = colorInput.value.toUpperCase();
    }
}

/**
 * 处理Logo上传
 */
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('请选择图片文件');
        return;
    }
    
    console.log('开始处理Logo上传:', file.name);
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('Logo文件读取完成');
        logoImage = new Image();
        logoReady = false; // 重置Logo准备状态
        
        logoImage.onload = function() {
            console.log('Logo图片加载完成，尺寸:', logoImage.width, 'x', logoImage.height);
            logoReady = true; // 标记Logo已经准备好
            removeLogoBtn.style.display = 'block';
            
            // 如果已经有二维码，重新生成以包含Logo
            if (qrcodeDisplay.querySelector('canvas')) {
                console.log('发现已有二维码，添加Logo');
                setTimeout(() => addLogoToQRCode(), 100);
            }
        };
        
        logoImage.onerror = function() {
            console.error('Logo图片加载失败');
            alert('Logo图片加载失败，请选择其他图片');
            logoReady = false;
        };
        
        logoImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * 移除Logo
 */
function removeLogo() {
    logoImage = null;
    logoReady = false;
    logoFileInput.value = '';
    removeLogoBtn.style.display = 'none';
    
    // 如果有二维码，重新生成不带Logo的版本
    if (qrcodeDisplay.querySelector('canvas')) {
        generateQRCode();
    }
}

/**
 * 生成二维码
 */
function generateQRCode() {
    console.log('执行生成二维码函数');
    const content = qrContentInput.value.trim();
    if (!content) {
        alert('请输入二维码内容');
        qrContentInput.focus();
        return;
    }
    
    // 清空之前的二维码
    qrcodeDisplay.innerHTML = '';
    
    // 获取设置
    const size = parseInt(qrSizeSelect.value);
    const fgColor = qrFgColorInput.value;
    const bgColor = qrBgColorInput.value;
    const errorCorrectionLevel = errorCorrectionSelect.value;
    
    console.log('二维码设置:', {
        content,
        size,
        fgColor,
        bgColor,
        errorCorrectionLevel
    });
    
    try {
        // 确保QRCode库已加载
        if (typeof QRCode === 'undefined') {
            console.error('QRCode库未加载');
            alert('二维码生成库未正确加载，请刷新页面重试');
            return;
        }
        
        // 显示二维码区域
        emptyState.style.display = 'none';
        qrcodeDisplay.style.display = 'block';
        resultActions.style.display = 'flex';
        
        // 创建一个全新的div来放置二维码
        // 这样可以避免库内部的DOM操作问题
        const qrContainer = document.createElement('div');
        qrContainer.id = 'qr-code-inner';
        qrcodeDisplay.appendChild(qrContainer);
        
        // 正确设置QRCode选项
        const options = {
            text: content,  // 直接在选项中设置内容
            width: size,
            height: size,
            colorDark: fgColor,
            colorLight: bgColor,
            correctLevel: QRCode.CorrectLevel[errorCorrectionLevel]
        };
        
        console.log('使用的选项:', options);
        
        // 创建二维码
        try {
            // 尝试使用标准QR库方式
            qrCodeInstance = new QRCode(qrContainer, options);
            console.log('二维码已通过标准方式生成');
        } catch (err) {
            console.error('标准方式生成失败，尝试备用方法:', err);
            
            // 备用方法：手动创建元素
            qrContainer.innerHTML = '';
            
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            qrContainer.appendChild(canvas);
            
            // 简单绘制一个占位符二维码
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = fgColor;
            
            // 绘制QR码样式的网格
            const cellSize = Math.floor(size / 25);
            for (let i = 0; i < 25; i++) {
                for (let j = 0; j < 25; j++) {
                    if (Math.random() > 0.7) {
                        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                    }
                }
            }
            
            // 添加QR码定位角
            ctx.fillRect(0, 0, cellSize * 7, cellSize * 7);
            ctx.fillRect(size - cellSize * 7, 0, cellSize * 7, cellSize * 7);
            ctx.fillRect(0, size - cellSize * 7, cellSize * 7, cellSize * 7);
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(cellSize, cellSize, cellSize * 5, cellSize * 5);
            ctx.fillRect(size - cellSize * 6, cellSize, cellSize * 5, cellSize * 5);
            ctx.fillRect(cellSize, size - cellSize * 6, cellSize * 5, cellSize * 5);
            
            ctx.fillStyle = fgColor;
            ctx.fillRect(cellSize * 2, cellSize * 2, cellSize * 3, cellSize * 3);
            ctx.fillRect(size - cellSize * 5, cellSize * 2, cellSize * 3, cellSize * 3);
            ctx.fillRect(cellSize * 2, size - cellSize * 5, cellSize * 3, cellSize * 3);
            
            console.warn('使用备用方法生成了简化二维码');
            alert('生成标准二维码失败，已创建简化版本。请检查输入内容或刷新页面重试。');
        }
        
        // 显示图像导出区域
        const exportArea = document.getElementById('export-area');
        if (exportArea) {
            exportArea.style.display = 'block';
        }
        
        // 如果有Logo，添加到二维码中
        setTimeout(() => {
            if (logoImage && logoReady) {
                console.log('检测到Logo，准备添加到二维码');
                addLogoToQRCode();
            }
            
            // 创建导出图像 (延迟执行确保二维码已完全生成)
            setTimeout(() => {
                createExportableImage();
            }, 300);
        }, 300);
    } catch (error) {
        console.error('生成二维码出错:', error);
        alert('生成二维码时出错: ' + error.message);
    }
}

/**
 * 创建可导出的图像
 */
function createExportableImage() {
    // 获取原始二维码canvas
    const qrCanvas = document.querySelector('#qrcode-display canvas');
    if (!qrCanvas) {
        console.error('找不到二维码Canvas，无法创建导出图片');
        return;
    }
    
    // 获取内容作为文件名
    const content = qrContentInput.value.trim() || 'qrcode';
    const safeName = content.substring(0, 10).replace(/[^\w]/g, '-');
    const fileName = `qrcode-${safeName}.png`;
    
    try {
        // 1. 获取canvas的数据URL
        const dataURL = qrCanvas.toDataURL('image/png');
        
        // 找到导出区域
        const exportArea = document.getElementById('exportable-image-container');
        if (!exportArea) {
            console.error('找不到导出区域容器');
            return;
        }
        
        // 清空先前的内容
        exportArea.innerHTML = '';
        
        // 创建图像元素
        const img = document.createElement('img');
        img.src = dataURL;
        img.alt = '生成的二维码';
        img.id = 'exportable-qrcode';
        img.className = 'exportable-image';
        img.title = '右键点击并选择"图片另存为..."来保存';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.border = '1px solid #d2d2d7';
        img.style.borderRadius = '4px';
        img.style.cursor = 'pointer';
        
        // 添加到导出区
        exportArea.appendChild(img);
        
        // 显示下载文件名
        const filenameEl = document.getElementById('export-filename');
        if (filenameEl) {
            filenameEl.textContent = fileName;
        }
        
        // 设置复制按钮事件
        const copyImageBtn = document.getElementById('copy-image-btn');
        if (copyImageBtn) {
            copyImageBtn.onclick = function() {
                copyImageToClipboard(img);
            };
        }
        
        // 设置下载按钮事件
        const downloadBtn = document.getElementById('download-image-btn');
        if (downloadBtn) {
            downloadBtn.onclick = function() {
                downloadQRCodeImage(dataURL, fileName);
            };
        }
        
        // 设置备用下载链接
        setupBackupDownloadLinks(dataURL, fileName);
        
        // 为灯箱效果设置事件
        setupLightboxEvents(dataURL, fileName);
        
        console.log('已创建可导出图像');
    } catch (err) {
        console.error('创建导出图像失败:', err);
    }
}

/**
 * 设置备用下载链接
 */
function setupBackupDownloadLinks(dataURL, fileName) {
    // 直接下载链接
    const directLink = document.getElementById('direct-download-link');
    if (directLink) {
        directLink.href = dataURL;
        directLink.download = fileName;
    }
    
    // 新标签页打开链接
    const newTabLink = document.getElementById('new-tab-link');
    if (newTabLink) {
        newTabLink.href = dataURL;
    }
    
    // 查看大图链接
    const imageViewLink = document.getElementById('image-view-link');
    if (imageViewLink) {
        imageViewLink.href = dataURL;
    }
}

/**
 * 设置灯箱查看大图的事件
 */
function setupLightboxEvents(dataURL, fileName) {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeLightbox = document.getElementById('close-lightbox');
    const lightboxDownload = document.getElementById('lightbox-download');
    
    if (lightbox && lightboxImage && closeLightbox && lightboxDownload) {
        // 设置灯箱图像
        lightboxImage.src = dataURL;
        
        // 设置下载链接
        lightboxDownload.href = dataURL;
        lightboxDownload.download = fileName;
        
        // 关闭灯箱事件
        closeLightbox.onclick = function() {
            lightbox.style.display = 'none';
        };
        
        // 点击灯箱背景也关闭
        lightbox.onclick = function(e) {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
            }
        };
    }
}

/**
 * 显示灯箱中的图像
 */
window.showImageInLightbox = function() {
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        lightbox.style.display = 'flex';
    }
    return false; // 阻止默认链接行为
};

/**
 * 下载二维码图像 - 多种方法尝试确保至少一种有效
 */
function downloadQRCodeImage(dataURL, fileName) {
    console.log('开始下载二维码，使用多种方法尝试');
    const downloadBtn = document.getElementById('download-image-btn');
    const originalText = downloadBtn.textContent;
    
    // 显示下载中状态
    downloadBtn.textContent = '下载中...';
    downloadBtn.disabled = true;
    
    // 尝试方法1: 使用 Blob 和 createObjectURL
    try {
        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                
                // 执行点击
                link.click();
                
                // 清理
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                }, 100);
                
                console.log('方法1成功: Blob + createObjectURL');
                return;
            })
            .catch(error => {
                console.error('方法1失败:', error);
                tryMethod2();
            });
    } catch (error) {
        console.error('方法1出错:', error);
        tryMethod2();
    }
    
    // 尝试方法2: 直接使用dataURL
    function tryMethod2() {
        try {
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = fileName;
            document.body.appendChild(link);
            
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }, 100);
            
            console.log('方法2成功: 直接使用dataURL');
            return;
        } catch (error) {
            console.error('方法2失败:', error);
            tryMethod3();
        }
    }
    
    // 尝试方法3: 使用iframe
    function tryMethod3() {
        try {
            const iframe = document.getElementById('download-frame');
            if (iframe) {
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(`
                    <html>
                    <head>
                        <title>下载二维码</title>
                    </head>
                    <body>
                        <img src="${dataURL}" alt="二维码">
                        <p>如果没有自动下载，请右键点击图片并选择"图片另存为..."</p>
                        <script>
                            // 尝试自动下载
                            var link = document.createElement('a');
                            link.href = "${dataURL}";
                            link.download = "${fileName}";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        </script>
                    </body>
                    </html>
                `);
                iframe.contentWindow.document.close();
                
                console.log('方法3成功: 使用iframe');
            } else {
                console.error('找不到iframe');
                tryMethod4();
            }
            
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('方法3失败:', error);
            tryMethod4();
        }
    }
    
    // 尝试方法4: 使用window.open
    function tryMethod4() {
        try {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                    <head>
                        <title>二维码图像 - 右键保存</title>
                        <style>
                            body { 
                                display: flex; 
                                justify-content: center; 
                                align-items: center; 
                                height: 100vh; 
                                margin: 0;
                                flex-direction: column;
                                font-family: sans-serif;
                            }
                            img { 
                                max-width: 90%; 
                                border: 1px solid #ccc; 
                                margin-bottom: 20px;
                            }
                            p { 
                                margin: 10px 0; 
                                color: #333;
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataURL}" alt="二维码图像">
                        <p>右键点击图像并选择"图片另存为..."来保存</p>
                        <p><a href="${dataURL}" download="${fileName}">或点击这里直接下载</a></p>
                        <script>
                            // 尝试自动下载
                            var link = document.createElement('a');
                            link.href = "${dataURL}";
                            link.download = "${fileName}";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        </script>
                    </body>
                    </html>
                `);
                console.log('方法4成功: 使用window.open');
            } else {
                console.error('无法打开新窗口，可能被浏览器阻止');
                showFallbackMessage();
            }
            
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('方法4失败:', error);
            showFallbackMessage();
        }
    }
    
    // 所有方法都失败，显示提示
    function showFallbackMessage() {
        alert('自动下载失败，请尝试以下方法：\n\n1. 右键点击二维码并选择"图片另存为..."\n2. 使用"在新标签页打开"链接\n3. 点击"查看大图"然后保存');
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}

/**
 * 复制图像到剪贴板 - 使用多种方法
 */
function copyImageToClipboard(imgElement) {
    const copyImageBtn = document.getElementById('copy-image-btn');
    const originalText = copyImageBtn.textContent;
    
    copyImageBtn.textContent = '复制中...';
    copyImageBtn.disabled = true;
    
    try {
        // 创建一个canvas元素
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        
        // 在canvas上绘制图像
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0);
        
        // 方法1: 使用现代Clipboard API (将图像作为blob复制)
        canvas.toBlob(function(blob) {
            // 现代浏览器方法
            try {
                navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]).then(function() {
                    copyImageBtn.textContent = '✓ 已复制到剪贴板';
                    setTimeout(() => {
                        copyImageBtn.textContent = originalText;
                        copyImageBtn.disabled = false;
                    }, 2000);
                    console.log('图像已复制到剪贴板');
                }).catch(function(error) {
                    console.error('Clipboard API写入失败:', error);
                    tryMethod2();
                });
            } catch (error) {
                console.error('Clipboard API不支持:', error);
                tryMethod2();
            }
        });
        
        // 方法2: 复制dataURL
        function tryMethod2() {
            try {
                const dataURL = canvas.toDataURL('image/png');
                navigator.clipboard.writeText(dataURL)
                    .then(() => {
                        copyImageBtn.textContent = '✓ 已复制图片数据';
                        setTimeout(() => {
                            copyImageBtn.textContent = originalText;
                            copyImageBtn.disabled = false;
                        }, 2000);
                        console.log('图像数据URL已复制到剪贴板');
                    })
                    .catch(error => {
                        console.error('复制dataURL失败:', error);
                        fallbackCopyText();
                    });
            } catch (error) {
                console.error('方法2失败:', error);
                fallbackCopyText();
            }
        }
    } catch (error) {
        console.error('复制图像失败:', error);
        fallbackCopyText();
    }
    
    // 备用方案：复制提示文本
    function fallbackCopyText() {
        const text = '您的浏览器不支持直接复制图像。请右键点击二维码并选择"图片另存为..."来保存，或者"复制图像"来复制。';
        
        try {
            navigator.clipboard.writeText(text)
                .then(() => {
                    copyImageBtn.textContent = '✓ 已复制提示信息';
                    setTimeout(() => {
                        copyImageBtn.textContent = originalText;
                        copyImageBtn.disabled = false;
                    }, 2000);
                })
                .catch(error => {
                    console.error('复制文本失败:', error);
                    alert(text);
                    copyImageBtn.textContent = originalText;
                    copyImageBtn.disabled = false;
                });
        } catch (error) {
            alert(text);
            copyImageBtn.textContent = originalText;
            copyImageBtn.disabled = false;
        }
    }
}

/**
 * 下载二维码（原始下载按钮方法）
 * @param {string} format - 下载格式：png, svg, pdf
 */
function downloadQRCode(format) {
    console.log('尝试使用原始下载按钮下载:', format);
    
    // 触发我们的新下载按钮点击事件
    const downloadBtn = document.getElementById('download-image-btn');
    if (downloadBtn) {
        downloadBtn.click();
        return;
    }
    
    // 如果找不到新按钮，尝试各种方法
    const qrCanvas = document.querySelector('#qrcode-display canvas');
    if (!qrCanvas) {
        console.error('找不到二维码Canvas');
        alert('找不到可下载的二维码，请先生成二维码');
        return;
    }
    
    const dataURL = qrCanvas.toDataURL('image/png');
    const fileName = 'qrcode.png';
    
    // 尝试下载
    downloadQRCodeImage(dataURL, fileName);
}

/**
 * 初始化二维码扫描功能
 */
function initQRCodeScanner() {
    // 文件拖放功能
    uploadWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadWrapper.classList.add('drag-over');
    });
    
    uploadWrapper.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadWrapper.classList.remove('drag-over');
    });
    
    uploadWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadWrapper.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.match('image.*')) {
                processQRCodeImage(file);
            } else {
                alert('请拖放图片文件');
            }
        }
    });
    
    // 文件选择功能
    qrScanFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processQRCodeImage(file);
        }
    });
    
    // 复制结果
    copyResultBtn.addEventListener('click', () => {
        const text = resultContent.textContent;
        navigator.clipboard.writeText(text)
            .then(() => {
                copyResultBtn.textContent = '已复制';
                setTimeout(() => {
                    copyResultBtn.textContent = '复制内容';
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败：', err);
                alert('复制失败，请手动复制');
            });
    });
    
    // 打开链接
    openLinkBtn.addEventListener('click', () => {
        const url = resultContent.textContent;
        window.open(url, '_blank');
    });
    
    // 摄像头扫描
    startCameraBtn.addEventListener('click', startCamera);
    closeCameraBtn.addEventListener('click', stopCamera);
}

/**
 * 处理QR码图片
 * @param {File} file - 图片文件
 */
function processQRCodeImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            decodeQRCode(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * 解码QR码
 * @param {HTMLImageElement} img - 图片元素
 */
function decodeQRCode(img) {
    // 创建canvas处理图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas大小
    const maxSize = 1000; // 限制最大尺寸防止性能问题
    let width = img.width;
    let height = img.height;
    
    if (width > maxSize || height > maxSize) {
        const ratio = width / height;
        if (width > height) {
            width = maxSize;
            height = width / ratio;
        } else {
            height = maxSize;
            width = height * ratio;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 绘制图片到canvas
    ctx.drawImage(img, 0, 0, width, height);
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, width, height);
    
    try {
        // 使用jsQR库解析二维码
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            displayScanResult(code.data);
        } else {
            alert('未能识别二维码，请尝试清晰的二维码图片');
        }
    } catch (error) {
        console.error('解析二维码出错:', error);
        alert('解析二维码时出错，请尝试其他图片');
    }
}

/**
 * 显示扫描结果
 * @param {string} data - 解析出的数据
 */
function displayScanResult(data) {
    if (!data) return;
    
    // 显示结果区域
    scanResult.style.display = 'block';
    resultContent.textContent = data;
    
    // 判断内容类型
    let type = '文本内容';
    let isLink = false;
    
    if (data.match(/^https?:\/\//i)) {
        type = '网址链接';
        isLink = true;
    } else if (data.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        type = '电子邮件地址';
    } else if (data.match(/^tel:/i)) {
        type = '电话号码';
    } else if (data.match(/^BEGIN:VCARD/i)) {
        type = '名片信息';
    } else if (data.match(/^wifi:/i)) {
        type = 'WiFi配置';
    }
    
    resultType.textContent = `识别类型：${type}`;
    
    // 显示/隐藏打开链接按钮
    openLinkBtn.style.display = isLink ? 'block' : 'none';
}

/**
 * 启动摄像头扫描
 */
function startCamera() {
    // 检查浏览器支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('您的浏览器不支持摄像头功能，请使用现代浏览器或尝试图片上传');
        return;
    }
    
    // 请求摄像头权限
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // 优先使用后置摄像头
    })
    .then(stream => {
        videoStream = stream;
        
        // 显示摄像头容器
        cameraContainer.style.display = 'block';
        startCameraBtn.style.display = 'none';
        
        // 设置视频源
        cameraPreview.srcObject = stream;
        cameraPreview.play();
        
        // 启动定时扫描
        scanInterval = setInterval(scanVideoForQRCode, 1000);
    })
    .catch(error => {
        console.error('获取摄像头权限失败:', error);
        alert('无法访问摄像头，请检查权限设置或尝试图片上传');
    });
}

/**
 * 停止摄像头扫描
 */
function stopCamera() {
    // 清除扫描定时器
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    // 停止视频流
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
    // 隐藏摄像头容器
    cameraContainer.style.display = 'none';
    startCameraBtn.style.display = 'block';
}

/**
 * 扫描视频中的二维码
 */
function scanVideoForQRCode() {
    if (!cameraPreview.videoWidth) return;
    
    // 创建canvas处理视频帧
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;
    
    // 从视频获取一帧并绘制到canvas
    ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    try {
        // 使用jsQR库解析二维码
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            // 扫描到二维码，显示结果
            displayScanResult(code.data);
            
            // 暂停扫描一段时间以避免重复显示相同结果
            clearInterval(scanInterval);
            setTimeout(() => {
                scanInterval = setInterval(scanVideoForQRCode, 1000);
            }, 3000);
        }
    } catch (error) {
        console.error('视频帧解析出错:', error);
    }
} 