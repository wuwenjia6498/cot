// 思维导图工具 JavaScript 实现
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const canvas = document.getElementById('mindmap-canvas');
    const newMapBtn = document.getElementById('new-map');
    const addNodeBtn = document.getElementById('add-node');
    const deleteNodeBtn = document.getElementById('delete-node');
    const changeColorBtn = document.getElementById('change-color');
    const clearMapBtn = document.getElementById('clear-map');
    const saveMapBtn = document.getElementById('save-map');
    const exportMapBtn = document.getElementById('export-map');
    const nodeEditor = document.getElementById('node-editor');
    const nodeTextInput = document.getElementById('node-text');
    const nodeColorSelect = document.getElementById('node-color');
    const saveNodeBtn = document.getElementById('save-node');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const templateBtns = document.querySelectorAll('.template-btn');
    const selectFileBtn = document.getElementById('select-file-btn');

    // 思维导图数据结构
    let mindMap = {
        nodes: [],
        connections: []
    };

    // 当前选中的节点
    let selectedNode = null;
    // 编辑中的节点
    let editingNode = null;
    // 是否正在拖动
    let isDragging = false;
    // 拖动偏移量
    let dragOffset = { x: 0, y: 0 };
    // 节点计数器（用于生成唯一ID）
    let nodeCounter = 0;

    // 初始化思维导图
    function initMindMap() {
        // 清空画布
        while (canvas.firstChild) {
            if (canvas.firstChild.classList && canvas.firstChild.classList.contains('start-guide')) {
                break;
            }
            canvas.removeChild(canvas.firstChild);
        }

        document.querySelector('.start-guide').style.display = 'none';
        
        // 创建根节点
        createRootNode();
    }

    // 清除思维导图
    function clearMindMap() {
        // 清空画布上的所有节点和连接线
        mindMap.nodes.forEach(node => {
            if (node.el && node.el.parentNode) {
                node.el.parentNode.removeChild(node.el);
            }
        });
        
        mindMap.connections.forEach(conn => {
            if (conn.el && conn.el.parentNode) {
                conn.el.parentNode.removeChild(conn.el);
            }
        });
        
        // 重置数据
        mindMap = {
            nodes: [],
            connections: []
        };
        
        nodeCounter = 0;
        selectedNode = null;
        
        // 显示开始指引
        document.querySelector('.start-guide').style.display = 'block';
    }

    // 创建根节点
    function createRootNode() {
        const rootNode = createNode('中心主题', canvas.clientWidth / 2, canvas.clientHeight / 2, true);
        selectNode(rootNode);
    }

    // 创建节点
    function createNode(text, x, y, isRoot = false) {
        const nodeId = 'node-' + (++nodeCounter);
        const node = document.createElement('div');
        node.id = nodeId;
        node.className = isRoot ? 'node root' : 'node';
        node.textContent = text;
        node.style.left = x + 'px';
        node.style.top = y + 'px';
        
        if (!isRoot) {
            node.style.borderColor = nodeColorSelect.value;
        }
        
        canvas.appendChild(node);
        
        // 添加到节点数组
        mindMap.nodes.push({
            id: nodeId,
            el: node,
            text: text,
            x: x,
            y: y,
            isRoot: isRoot,
            color: isRoot ? '#3182CE' : nodeColorSelect.value,
            parentId: selectedNode ? selectedNode.id : null
        });
        
        // 添加事件监听器
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(node);
        });
        
        node.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            openNodeEditor(node);
        });
        
        node.addEventListener('mousedown', startDragging);
        
        // 如果有父节点，则创建连接线
        if (selectedNode) {
            createConnection(selectedNode, node);
        }
        
        return node;
    }

    // 创建连接线
    function createConnection(parentNode, childNode) {
        const connection = document.createElement('div');
        connection.className = 'connector';
        canvas.insertBefore(connection, canvas.firstChild);
        
        // 保存连接信息
        const connectionInfo = {
            el: connection,
            from: parentNode.id,
            to: childNode.id
        };
        
        mindMap.connections.push(connectionInfo);
        
        // 更新连接线位置
        updateConnection(connectionInfo);
    }

    // 更新连接线位置和样式
    function updateConnection(connection) {
        const fromNode = document.getElementById(connection.from);
        const toNode = document.getElementById(connection.to);
        
        if (!fromNode || !toNode) return;
        
        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // 计算线的起点和终点（相对于canvas）
        const fromX = fromNode.offsetLeft + fromNode.offsetWidth / 2;
        const fromY = fromNode.offsetTop + fromNode.offsetHeight / 2;
        const toX = toNode.offsetLeft + toNode.offsetWidth / 2;
        const toY = toNode.offsetTop + toNode.offsetHeight / 2;
        
        // 计算线的长度和角度
        const dx = toX - fromX;
        const dy = toY - fromY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // 设置线的位置和样式
        connection.el.style.width = length + 'px';
        connection.el.style.height = '2px';
        connection.el.style.left = fromX + 'px';
        connection.el.style.top = fromY + 'px';
        connection.el.style.transform = `rotate(${angle}deg)`;
        
        // 设置线的颜色
        const childNode = findNodeById(connection.to);
        if (childNode) {
            connection.el.style.backgroundColor = childNode.color;
        }
    }

    // 更新所有连接线
    function updateAllConnections() {
        mindMap.connections.forEach(updateConnection);
    }

    // 选择节点
    function selectNode(node) {
        // 取消之前选中的节点
        if (selectedNode) {
            selectedNode.classList.remove('selected');
        }
        
        // 选中新节点
        node.classList.add('selected');
        selectedNode = node;
    }

    // 打开节点编辑器
    function openNodeEditor(node) {
        editingNode = node;
        const nodeData = findNodeById(node.id);
        
        nodeTextInput.value = nodeData.text;
        nodeColorSelect.value = nodeData.color;
        
        nodeEditor.style.display = 'block';
    }

    // 根据ID查找节点数据
    function findNodeById(id) {
        return mindMap.nodes.find(node => node.id === id);
    }

    // 开始拖拽节点
    function startDragging(e) {
        if (e.button !== 0) return; // 只响应左键点击
        
        const node = e.target;
        selectNode(node);
        
        isDragging = true;
        
        // 计算鼠标在节点上的相对位置
        const rect = node.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        // 添加临时事件监听器
        document.addEventListener('mousemove', dragNode);
        document.addEventListener('mouseup', stopDragging);
        
        // 防止文本选择
        e.preventDefault();
    }

    // 拖拽节点
    function dragNode(e) {
        if (!isDragging || !selectedNode) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - dragOffset.x;
        const y = e.clientY - canvasRect.top - dragOffset.y;
        
        // 移动节点
        selectedNode.style.left = x + 'px';
        selectedNode.style.top = y + 'px';
        
        // 更新节点数据
        const nodeData = findNodeById(selectedNode.id);
        if (nodeData) {
            nodeData.x = x;
            nodeData.y = y;
        }
        
        // 更新连接线
        updateAllConnections();
    }

    // 停止拖拽
    function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', dragNode);
        document.removeEventListener('mouseup', stopDragging);
    }

    // 添加子节点
    function addChildNode() {
        if (!selectedNode) return;
        
        // 计算新节点位置（在选中节点右侧）
        const parentRect = selectedNode.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const x = selectedNode.offsetLeft + selectedNode.offsetWidth + 50;
        const y = selectedNode.offsetTop;
        
        createNode('新节点', x, y);
    }

    // 删除节点
    function deleteSelectedNode() {
        if (!selectedNode || selectedNode.classList.contains('root')) {
            // 不允许删除根节点
            alert('不能删除中心主题！');
            return;
        }
        
        const nodeId = selectedNode.id;
        
        // 删除连接线
        mindMap.connections = mindMap.connections.filter(conn => {
            if (conn.from === nodeId || conn.to === nodeId) {
                canvas.removeChild(conn.el);
                return false;
            }
            return true;
        });
        
        // 删除子节点（递归）
        function removeChildNodes(parentId) {
            mindMap.nodes = mindMap.nodes.filter(node => {
                if (node.parentId === parentId) {
                    // 移除DOM元素
                    if (node.el && node.el.parentNode) {
                        node.el.parentNode.removeChild(node.el);
                    }
                    // 继续递归删除子节点
                    removeChildNodes(node.id);
                    return false;
                }
                return true;
            });
        }
        
        // 执行子节点删除
        removeChildNodes(nodeId);
        
        // 从数组中移除节点
        mindMap.nodes = mindMap.nodes.filter(node => {
            if (node.id === nodeId) {
                return false;
            }
            return true;
        });
        
        // 移除DOM元素
        canvas.removeChild(selectedNode);
        selectedNode = null;
    }

    // 更改节点颜色
    function changeNodeColor() {
        if (!selectedNode || selectedNode.classList.contains('root')) {
            // 不允许更改根节点颜色
            return;
        }
        
        openNodeEditor(selectedNode);
    }

    // 保存节点编辑
    function saveNodeEdit() {
        if (!editingNode) return;
        
        const nodeData = findNodeById(editingNode.id);
        if (!nodeData) return;
        
        // 更新节点文本
        nodeData.text = nodeTextInput.value;
        editingNode.textContent = nodeTextInput.value;
        
        // 如果不是根节点，则更新颜色
        if (!nodeData.isRoot) {
            nodeData.color = nodeColorSelect.value;
            editingNode.style.borderColor = nodeColorSelect.value;
            
            // 更新关联的连接线颜色
            mindMap.connections.forEach(conn => {
                if (conn.to === editingNode.id) {
                    conn.el.style.backgroundColor = nodeColorSelect.value;
                }
            });
        }
        
        // 关闭编辑面板
        closeNodeEditor();
    }

    // 关闭节点编辑器
    function closeNodeEditor() {
        nodeEditor.style.display = 'none';
        editingNode = null;
    }

    // 保存思维导图
    function saveMindMap() {
        if (mindMap.nodes.length === 0) {
            alert('请先创建思维导图！');
            return;
        }
        
        // 准备要保存的数据
        const data = {
            nodes: mindMap.nodes.map(node => ({
                id: node.id,
                text: node.text,
                x: parseFloat(node.el.style.left),
                y: parseFloat(node.el.style.top),
                isRoot: node.isRoot,
                color: node.color,
                parentId: node.parentId
            })),
            connections: mindMap.connections.map(conn => ({
                from: conn.from,
                to: conn.to
            }))
        };
        
        // 转换为JSON并保存到本地存储
        localStorage.setItem('mindmap-data', JSON.stringify(data));
        
        // 创建下载文件
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接并触发点击
        const a = document.createElement('a');
        a.href = url;
        a.download = '思维导图_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // 导出思维导图为图片
    function exportMindMap() {
        if (mindMap.nodes.length === 0) {
            alert('请先创建思维导图！');
            return;
        }
        
        // 隐藏不需要导出的元素
        const startGuide = document.querySelector('.start-guide');
        const editPanel = document.getElementById('node-editor');
        
        const startGuideDisplay = startGuide.style.display;
        const editPanelDisplay = editPanel.style.display;
        
        startGuide.style.display = 'none';
        editPanel.style.display = 'none';
        
        // 使用html2canvas库捕获画布内容
        html2canvas(canvas, {
            backgroundColor: '#ffffff',
            scale: 2, // 提高清晰度
            logging: false,
            onclone: function(clonedDoc) {
                // 在克隆的文档中调整样式
                const clonedCanvas = clonedDoc.getElementById('mindmap-canvas');
                clonedCanvas.style.width = canvas.offsetWidth + 'px';
                clonedCanvas.style.height = canvas.offsetHeight + 'px';
                clonedCanvas.style.overflow = 'hidden';
            }
        }).then(function(canvas) {
            // 将画布转换为图像
            const imgData = canvas.toDataURL('image/png');
            
            // 创建下载链接
            const a = document.createElement('a');
            a.href = imgData;
            a.download = '思维导图_' + new Date().toISOString().slice(0, 10) + '.png';
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                // 恢复原始显示状态
                startGuide.style.display = startGuideDisplay;
                editPanel.style.display = editPanelDisplay;
            }, 100);
        }).catch(function(error) {
            console.error('导出图片失败:', error);
            alert('导出图片失败，请稍后重试！');
            
            // 恢复原始显示状态
            startGuide.style.display = startGuideDisplay;
            editPanel.style.display = editPanelDisplay;
        });
    }

    // 加载思维导图文件
    function loadMindMapFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // 清空当前画布
                clearMindMap();
                
                // 首先创建所有节点
                data.nodes.forEach(nodeData => {
                    const node = document.createElement('div');
                    node.id = nodeData.id;
                    node.className = nodeData.isRoot ? 'node root' : 'node';
                    node.textContent = nodeData.text;
                    node.style.left = nodeData.x + 'px';
                    node.style.top = nodeData.y + 'px';
                    
                    if (!nodeData.isRoot) {
                        node.style.borderColor = nodeData.color;
                    }
                    
                    canvas.appendChild(node);
                    
                    // 添加事件监听器
                    node.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectNode(node);
                    });
                    
                    node.addEventListener('dblclick', (e) => {
                        e.stopPropagation();
                        openNodeEditor(node);
                    });
                    
                    node.addEventListener('mousedown', startDragging);
                    
                    // 添加到节点数组
                    mindMap.nodes.push({
                        id: nodeData.id,
                        el: node,
                        text: nodeData.text,
                        x: nodeData.x,
                        y: nodeData.y,
                        isRoot: nodeData.isRoot,
                        color: nodeData.color,
                        parentId: nodeData.parentId
                    });
                    
                    // 更新节点计数器
                    const idNum = parseInt(nodeData.id.split('-')[1]);
                    if (idNum > nodeCounter) {
                        nodeCounter = idNum;
                    }
                });
                
                // 创建连接线
                data.connections.forEach(connData => {
                    const fromNode = document.getElementById(connData.from);
                    const toNode = document.getElementById(connData.to);
                    
                    if (fromNode && toNode) {
                        const connection = document.createElement('div');
                        connection.className = 'connector';
                        canvas.insertBefore(connection, canvas.firstChild);
                        
                        const connectionInfo = {
                            el: connection,
                            from: connData.from,
                            to: connData.to
                        };
                        
                        mindMap.connections.push(connectionInfo);
                        
                        // 更新连接线位置
                        updateConnection(connectionInfo);
                    }
                });
                
                // 隐藏开始指引
                document.querySelector('.start-guide').style.display = 'none';
                
            } catch (error) {
                console.error('加载思维导图文件失败:', error);
                alert('无效的思维导图文件!');
            }
        };
        
        reader.readAsText(file);
    }

    // 选择文件按钮点击事件
    function handleSelectFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                loadMindMapFile(file);
            }
        };
        
        input.click();
    }

    // 事件监听器
    newMapBtn.addEventListener('click', initMindMap);
    addNodeBtn.addEventListener('click', addChildNode);
    deleteNodeBtn.addEventListener('click', deleteSelectedNode);
    changeColorBtn.addEventListener('click', changeNodeColor);
    clearMapBtn.addEventListener('click', clearMindMap);
    saveMapBtn.addEventListener('click', saveMindMap);
    exportMapBtn.addEventListener('click', exportMindMap);
    saveNodeBtn.addEventListener('click', saveNodeEdit);
    cancelEditBtn.addEventListener('click', closeNodeEditor);
    
    // 选择文件按钮
    if(selectFileBtn) {
        selectFileBtn.addEventListener('click', handleSelectFile);
    }
    
    // 拖放文件上传功能
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        canvas.classList.add('drag-over');
    });
    
    canvas.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        canvas.classList.remove('drag-over');
    });
    
    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        canvas.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.json')) {
                loadMindMapFile(file);
            } else {
                alert('请上传.json格式的思维导图文件！');
            }
        }
    });
    
    // 画布点击事件（取消选择）
    canvas.addEventListener('click', function(e) {
        if (e.target === canvas) {
            if (selectedNode) {
                selectedNode.classList.remove('selected');
                selectedNode = null;
            }
        }
    });
    
    // 键盘删除快捷键
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' && selectedNode && !selectedNode.classList.contains('root')) {
            deleteSelectedNode();
        }
    });
    
    // 为模板按钮添加直接的点击事件监听器
    const projectTemplateBtn = document.getElementById('project-template');
    const brainstormTemplateBtn = document.getElementById('brainstorm-template');
    const studyTemplateBtn = document.getElementById('study-template');
    
    if (projectTemplateBtn) {
        projectTemplateBtn.addEventListener('click', function() {
            console.log('项目计划按钮被点击');
            loadTemplate('project');
        });
    }
    
    if (brainstormTemplateBtn) {
        brainstormTemplateBtn.addEventListener('click', function() {
            console.log('头脑风暴按钮被点击');
            loadTemplate('brainstorm');
        });
    }
    
    if (studyTemplateBtn) {
        studyTemplateBtn.addEventListener('click', function() {
            console.log('学习笔记按钮被点击');
            loadTemplate('study');
        });
    }
    
    // 模板按钮事件（通用处理）
    templateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const template = this.getAttribute('data-template');
            console.log('模板按钮被点击:', template);
            loadTemplate(template);
        });
    });
    
    // 尝试从本地存储加载数据
    const savedData = localStorage.getItem('mindmap-data');
    if (savedData) {
        try {
            // 这里可以实现加载已保存的思维导图
            // 出于简化，这部分代码未实现
        } catch (e) {
            console.error('加载保存的思维导图失败:', e);
        }
    }

    // 加载模板
    function loadTemplate(templateName) {
        console.log('Loading template:', templateName);
        let template;
        
        switch(templateName) {
            case 'project':
                template = {
                    root: '项目计划',
                    children: ['目标', '任务', '资源', '时间线']
                };
                break;
            case 'brainstorm':
                template = {
                    root: '创意主题',
                    children: ['想法1', '想法2', '想法3', '下一步行动']
                };
                break;
            case 'study':
                template = {
                    root: '学习主题',
                    children: ['关键概念', '重要知识点', '例题', '复习计划']
                };
                break;
            default:
                console.error('未知模板类型:', templateName);
                return;
        }
        
        // 清空画布
        clearMindMap();
        
        // 隐藏开始指引
        document.querySelector('.start-guide').style.display = 'none';
        
        // 创建根节点
        const rootNode = createNode(template.root, canvas.clientWidth / 2, canvas.clientHeight / 2, true);
        
        // 创建子节点
        const angleStep = (2 * Math.PI) / template.children.length;
        const radius = 150;
        
        template.children.forEach((text, index) => {
            const angle = angleStep * index;
            const x = canvas.clientWidth / 2 + radius * Math.cos(angle);
            const y = canvas.clientHeight / 2 + radius * Math.sin(angle);
            
            selectNode(rootNode);
            createNode(text, x, y);
        });
        
        // 选中根节点
        selectNode(rootNode);
    }
}); 