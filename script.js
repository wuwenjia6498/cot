// 添加卡片点击效果
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
        const toolName = card.querySelector('h2').textContent;
        
        // 为演示目的，简单地显示"功能即将推出"的消息
        showToolNotification(toolName);
    });
});

// 添加平滑滚动效果
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetEl = document.querySelector(this.getAttribute('href'));
        if (targetEl) {
            targetEl.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// 添加页面加载动画
window.addEventListener('load', () => {
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 150);
});

// 添加响应式导航菜单（如果需要）
const toggleMenu = () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('active');
    }
};

// 显示工具通知
function showToolNotification(toolName) {
    // 检查是否已有通知，如果有则移除
    const existingNotification = document.querySelector('.tool-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = 'tool-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>${toolName}</h3>
            <p>该功能即将推出，敬请期待！</p>
            <button class="close-btn">知道了</button>
        </div>
    `;
    
    // 添加通知样式
    const style = document.createElement('style');
    if (!document.querySelector('#notification-style')) {
        style.id = 'notification-style';
        style.textContent = `
            .tool-notification {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .notification-content {
                background-color: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                max-width: 400px;
                width: 90%;
                text-align: center;
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            
            .notification-content h3 {
                margin-bottom: 1rem;
                color: #3474D4;
            }
            
            .close-btn {
                margin-top: 1.5rem;
                padding: 0.6rem 1.5rem;
                background-color: #3474D4;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.3s ease;
            }
            
            .close-btn:hover {
                background-color: #2860B8;
            }
            
            .tool-notification.show {
                opacity: 1;
            }
            
            .tool-notification.show .notification-content {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
    
    // 添加通知到页面
    document.body.appendChild(notification);
    
    // 动画显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 点击关闭按钮移除通知
    notification.querySelector('.close-btn').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // 点击背景区域也可以关闭通知
    notification.addEventListener('click', (e) => {
        if (e.target === notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    });
}

// 为FAQ添加动画效果
document.querySelectorAll('details').forEach(details => {
    details.addEventListener('toggle', () => {
        if (details.open) {
            const content = details.querySelector('p');
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            content.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
            
            setTimeout(() => {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
            }, 10);
        }
    });
});

// 示例：加载首页功能时准备调用API
function prepareAPICall() {
    // 您的API调用准备代码
    console.log('准备调用后端API');
}

// 其他前端逻辑...

// 名言数据
const quotes = [
    {
        text: "生活中不是缺少美，而是缺少发现美的眼睛。",
        author: "罗丹"
    },
    {
        text: "把事情做对很重要，但是找到要做的正确事情更重要。",
        author: "彼得·德鲁克"
    },
    {
        text: "种一棵树最好的时间是十年前，其次是现在。",
        author: "中国谚语"
    },
    {
        text: "简单是最终的复杂。",
        author: "达芬奇"
    },
    {
        text: "我们必须拥抱痛苦，别无选择。不过，我们可以选择拥抱的方式。",
        author: "奥修"
    },
    {
        text: "与其用华丽的外衣装饰自己，不如用知识武装自己。",
        author: "伊索"
    },
    {
        text: "真正的智慧是承认自己的无知。",
        author: "苏格拉底"
    },
    {
        text: "时间是一切财富中最宝贵的财富。",
        author: "德奥弗拉斯多"
    }
];

// 当页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    const quoteText = document.querySelector('.quote-text');
    const quoteAuthor = document.querySelector('.quote-author');
    const refreshButton = document.querySelector('.refresh-quote');
    
    // 记录已显示过的名言索引
    let usedIndices = new Set();
    
    // 获取随机名言
    function getRandomQuote() {
        // 如果所有名言都已显示过，则重置记录
        if (usedIndices.size >= quotes.length) {
            usedIndices.clear();
        }
        
        // 获取未使用过的名言
        let availableQuotes = quotes.filter((_, index) => !usedIndices.has(index));
        let randomIndex = Math.floor(Math.random() * availableQuotes.length);
        let selectedQuote = availableQuotes[randomIndex];
        
        // 记录已使用的名言索引
        usedIndices.add(quotes.indexOf(selectedQuote));
        
        return selectedQuote;
    }
    
    // 更新显示的名言
    function updateQuote() {
        const quote = getRandomQuote();
        quoteText.textContent = quote.text;
        quoteAuthor.textContent = `— ${quote.author}`;
    }
    
    // 点击刷新按钮时更新名言
    refreshButton.addEventListener('click', () => {
        // 添加旋转动画
        refreshButton.style.transition = 'transform 0.3s ease';
        refreshButton.style.transform = 'rotate(180deg)';
        
        // 更新名言
        updateQuote();
        
        // 重置旋转
        setTimeout(() => {
            refreshButton.style.transform = 'none';
        }, 300);
    });
    
    // 初始化显示一条名言
    updateQuote();
});

// 添加时间格式化函数
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 添加判断今天的函数
function isToday(timestamp) {
    const today = new Date();
    const date = new Date(timestamp);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// 添加截止时间检查和提醒功能
function checkDeadlines() {
    const now = new Date().getTime();
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    
    todos.forEach(todo => {
        if (todo.deadline && !todo.completed && !todo.notified) {
            const timeLeft = todo.deadline - now;
            const hoursLeft = timeLeft / (1000 * 60 * 60);
            
            // 如果距离截止时间小于1小时且未完成
            if (hoursLeft > 0 && hoursLeft <= 1) {
                // 发送系统通知（如果浏览器支持）
                if (Notification.permission === "granted") {
                    new Notification("待办事项即将到期", {
                        body: `"${todo.text}" 将在1小时内到期`,
                        icon: "/favicon.ico"
                    });
                    // 标记为已通知
                    todo.notified = true;
                }
            }
        }
    });
    
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 修改渲染待办事项函数，增加紧急提醒样式
function getDeadlineStatus(deadline) {
    if (!deadline) return '';
    
    const now = new Date().getTime();
    const timeLeft = deadline - now;
    const hoursLeft = timeLeft / (1000 * 60 * 60);
    
    if (timeLeft < 0) return 'expired';
    if (hoursLeft <= 1) return 'urgent';
    if (hoursLeft <= 24) return 'near';
    return '';
}

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
    .todo-deadline.urgent {
        color: #e74c3c;
        font-weight: bold;
        animation: pulse 2s infinite;
    }
    
    .todo-deadline.expired {
        color: #7f8c8d;
        text-decoration: line-through;
    }
    
    .todo-deadline.near {
        color: #f39c12;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .todo-item.urgent {
        background: rgba(231, 76, 60, 0.05);
        border-color: #e74c3c;
    }
`;
document.head.appendChild(style);

// 修改待办事项功能
document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const todoDeadline = document.getElementById('todo-deadline');
    const addButton = document.querySelector('.add-todo');
    const todoList = document.getElementById('todo-list');
    const todoFilter = document.getElementById('todo-filter');
    const todoExpand = document.getElementById('todo-expand');
    
    let todos = JSON.parse(localStorage.getItem('todos') || '[]');
    
    // 格式化显示时间
    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 如果是今天
        if (date.toDateString() === today.toDateString()) {
            return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        // 如果是明天
        else if (date.toDateString() === tomorrow.toDateString()) {
            return `明天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        // 其他日期
        else {
            return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
    }
    
    // 修改过滤待办事项函数
    function filterTodos(todos, filterValue) {
        return todos.filter(todo => {
            switch(filterValue) {
                case 'today':
                    return isToday(todo.createdAt);
                case 'active':
                    return !todo.completed;
                case 'completed':
                    return todo.completed;
                default:
                    return true;
            }
        });
    }
    
    // 渲染待办事项
    function renderTodos() {
        const filterValue = todoFilter ? todoFilter.value : 'all';
        const filteredTodos = filterTodos(todos, filterValue);
        
        todoList.innerHTML = '';
        filteredTodos.forEach((todo, index) => {
            const todoItem = document.createElement('div');
            const deadlineStatus = getDeadlineStatus(todo.deadline);
            
            // 添加紧急状态类
            todoItem.className = `todo-item ${deadlineStatus === 'urgent' ? 'urgent' : ''}`;
            
            // 如果是编辑模式
            if (todo.isEditing) {
                const deadlineValue = todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : '';
                todoItem.classList.add('editing');
                todoItem.innerHTML = `
                    <form class="todo-edit-form" data-index="${index}">
                        <input type="text" class="todo-edit-input" value="${todo.text}" maxlength="50">
                        <input type="datetime-local" class="todo-edit-deadline" value="${deadlineValue}">
                        <div class="edit-actions">
                            <button type="submit" class="save-edit" title="保存">
                                <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M43 5L16 32L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <button type="button" class="cancel-edit" title="取消">
                                <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 14l20 20M14 34l20-20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </form>
                `;
            } else {
                const deadlineHtml = todo.deadline ? `
                    <span class="todo-deadline ${deadlineStatus}">
                        <svg width="12" height="12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 12v12l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                        ${formatDateTime(todo.deadline)}
                        ${deadlineStatus === 'urgent' ? ' (即将到期!)' : ''}
                        ${deadlineStatus === 'expired' ? ' (已过期)' : ''}
                    </span>
                ` : '';
                
                todoItem.innerHTML = `
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-index="${index}"></div>
                    <span class="todo-text ${todo.completed ? 'completed' : ''}" data-index="${index}">${todo.text}</span>
                    ${deadlineHtml}
                    <span class="todo-time">${formatTime(todo.createdAt)}</span>
                    <button class="edit-todo" data-index="${index}" title="编辑">
                        <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 42h36M24 6l-4 4 20 20 4-4L24 6zM20 10l4 4M36 26l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <button class="delete-todo" data-index="${index}" title="删除">
                        <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 14l20 20M14 34l20-20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                `;
            }
            todoList.appendChild(todoItem);
        });
        
        // 控制展开按钮的显示/隐藏
        if (filteredTodos.length > 3) {
            todoExpand.style.display = 'flex';
            todoExpand.textContent = todoList.classList.contains('expanded') ? '收起' : '显示更多';
        } else {
            todoExpand.style.display = 'none';
            todoList.classList.remove('expanded');
        }
        
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    // 添加待办事项
    function addTodo() {
        const text = todoInput.value.trim();
        const deadline = todoDeadline.value ? new Date(todoDeadline.value).getTime() : null;
        
        if (text) {
            todos.unshift({ 
                text,
                completed: false,
                createdAt: new Date().getTime(),
                deadline: deadline
            });
            todoInput.value = '';
            todoDeadline.value = '';
            renderTodos();
        }
    }
    
    // 绑定事件
    if (addButton) {
        addButton.addEventListener('click', addTodo);
    }
    
    if (todoInput) {
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }
    
    // 绑定筛选事件
    if (todoFilter) {
        todoFilter.addEventListener('change', renderTodos);
    }
    
    // 绑定点击事件到todoList容器（事件委托）
    if (todoList) {
        todoList.addEventListener('click', (e) => {
            const checkbox = e.target.closest('.todo-checkbox');
            const deleteBtn = e.target.closest('.delete-todo');
            const editBtn = e.target.closest('.edit-todo');
            const cancelBtn = e.target.closest('.cancel-edit');
            
            if (checkbox) {
                const index = parseInt(checkbox.dataset.index);
                todos[index].completed = !todos[index].completed;
                renderTodos();
            }
            
            if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                todos.splice(index, 1);
                renderTodos();
            }
            
            if (editBtn) {
                const index = parseInt(editBtn.dataset.index);
                todos[index].isEditing = true;
                renderTodos();
            }
            
            if (cancelBtn) {
                const form = cancelBtn.closest('.todo-edit-form');
                const index = parseInt(form.dataset.index);
                todos[index].isEditing = false;
                renderTodos();
            }
        });
        
        // 处理编辑表单的提交
        todoList.addEventListener('submit', (e) => {
            if (e.target.classList.contains('todo-edit-form')) {
                e.preventDefault();
                const form = e.target;
                const index = parseInt(form.dataset.index);
                const newText = form.querySelector('.todo-edit-input').value.trim();
                const newDeadline = form.querySelector('.todo-edit-deadline').value;
                
                if (newText) {
                    todos[index].text = newText;
                    todos[index].deadline = newDeadline ? new Date(newDeadline).getTime() : null;
                    todos[index].isEditing = false;
                    renderTodos();
                }
            }
        });
    }
    
    // 绑定展开/折叠功能
    if (todoExpand) {
        todoExpand.addEventListener('click', () => {
            todoList.classList.toggle('expanded');
            todoExpand.textContent = todoList.classList.contains('expanded') ? '收起' : '显示更多';
        });
    }
    
    // 初始渲染
    renderTodos();
    
    // 在页面加载时请求通知权限
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    
    // 每分钟检查一次截止时间
    setInterval(checkDeadlines, 60000);
});

// 添加拖拽排序功能
function enableDragSort() {
    const sortable = new Sortable(todoList, {
        animation: 150,
        onEnd: function(evt) {
            const item = todos[evt.oldIndex];
            todos.splice(evt.oldIndex, 1);
            todos.splice(evt.newIndex, 0, item);
            localStorage.setItem('todos', JSON.stringify(todos));
        }
    });
}

// 添加导入导出功能
function exportTodos() {
    const dataStr = JSON.stringify(todos);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'todos.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importTodos(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTodos = JSON.parse(e.target.result);
            todos = importedTodos;
            renderTodos();
        } catch (error) {
            alert('导入失败，请检查文件格式');
        }
    };
    reader.readAsText(file);
} 