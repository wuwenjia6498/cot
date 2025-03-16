// 获取DOM元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const maxWidthSlider = document.getElementById('maxWidth');
const maxWidthValue = document.getElementById('maxWidthValue');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalInfo = document.getElementById('originalInfo');
const compressedInfo = document.getElementById('compressedInfo');
const downloadBtn = document.getElementById('downloadBtn');

// 当前处理的图片数据
let currentFile = null;

// 绑定拖放事件
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 添加拖放区域的视觉反馈
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('drag-over');
}

function unhighlight(e) {
    dropZone.classList.remove('drag-over');
}

// 处理文件拖放
dropZone.addEventListener('drop', handleDrop, false);
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }

    currentFile = file;
    displayOriginalImage(file);
    compressImage(file);
}

// 显示原始图片
function displayOriginalImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        originalPreview.src = e.target.result;
        updateImageInfo(originalInfo, file.size, '获取中...');
        
        // 获取图片实际尺寸
        const img = new Image();
        img.onload = () => {
            updateImageInfo(originalInfo, file.size, `${img.width} x ${img.height}`);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 更新图片信息显示
function updateImageInfo(element, size, dimensions) {
    const sizeText = formatFileSize(size);
    element.innerHTML = `
        <p>尺寸：${dimensions}</p>
        <p>大小：${sizeText}</p>
    `;
}

// 格式化文件大小显示
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 压缩图片
function compressImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // 创建canvas
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // 调整图片尺寸
            const maxWidth = parseInt(maxWidthSlider.value);
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            // 绘制图片
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);

            // 输出压缩后的图片
            const quality = parseInt(qualitySlider.value) / 100;
            canvas.toBlob((blob) => {
                const compressedUrl = URL.createObjectURL(blob);
                compressedPreview.src = compressedUrl;
                updateImageInfo(compressedInfo, blob.size, `${width} x ${height}`);
                
                // 启用下载按钮
                downloadBtn.disabled = false;
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = compressedUrl;
                    link.download = `compressed_${file.name}`;
                    link.click();
                };
            }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 监听滑块变化
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = `${e.target.value}%`;
    if (currentFile) {
        compressImage(currentFile);
    }
});

maxWidthSlider.addEventListener('input', (e) => {
    maxWidthValue.textContent = `${e.target.value}px`;
    if (currentFile) {
        compressImage(currentFile);
    }
}); 