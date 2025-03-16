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

// 保留本地名言作为后备数据，整合新添加的名言
const localQuotes = [
    { text: "生活中不是缺少美，而是缺少发现美的眼睛。", author: "罗丹" },
    { text: "把事情做对很重要，但把正确的事情做更重要。", author: "彼得·德鲁克" },
    { text: "简单是最终的复杂。", author: "达芬奇" },
    { text: "优秀的设计是让复杂的东西变得简单。", author: "乔布斯" },
    { text: "读书是在别人思想的帮助下，建立自己的思想。", author: "鲁巴金" },
    { text: "一个不读书的人，和一个不使用工具的人没有本质区别。", author: "佚名" },
    { text: "真正的书籍不是用来被阅读的，而是用来被思考的。", author: "卡莱尔" },
    { text: "不去读书的人，当然永远不会发现，世界上还有另一个自己。", author: "村上春树" },
    { text: "一本好书胜过一百个朋友，而一个好朋友等于一座图书馆。", author: "狄更斯" },
    { text: "一本书是一个世界，而一个书架，就是无数个世界。", author: "科斯托兰尼" },
    { text: "有些书应该浅尝辄止，有些书应该细嚼慢咽，而有些书则应该像蜂蜜一样细细品味。", author: "培根" },
    { text: "一个人的气质里，藏着他走过的路、爱过的人和读过的书。", author: "三毛" },
    { text: "阅读是一种孤独的旅程，目的地是更深层的自我。", author: "毛姆" },
    { text: "每一本书，都是一个未曾见过的世界。", author: "J.K.罗琳" },
    { text: "阅读是一种超能力，它让你在别人的经验里成长。", author: "比尔·盖茨" },
    { text: "如果你想让世界变得更好，首先要让自己变得更聪明——从阅读开始。", author: "奥巴马" },
    { text: "书不会改变世界，但读书的人会。", author: "玛丽安·摩尔" }
];

// 从后端获取名言
async function fetchQuote() {
    try {
        const response = await fetch('http://localhost:3000/api/quote');
        if (!response.ok) {
            throw new Error('获取名言失败');
        }
        const { success, data, error } = await response.json();
        if (!success) {
            throw new Error(error);
        }
        return data;
    } catch (error) {
        console.error('API错误:', error);
        // 返回一条本地名言作为后备
        return localQuotes[Math.floor(Math.random() * localQuotes.length)];
    }
}

// 更新名言显示
async function updateQuote() {
    const quoteText = document.querySelector('.quote-text');
    const quoteAuthor = document.querySelector('.quote-author');
    const refreshButton = document.querySelector('.refresh-quote svg');

    // 添加加载状态
    quoteText.style.opacity = '0.5';
    quoteText.textContent = '正在获取新的名言...';
    quoteAuthor.style.opacity = '0';
    refreshButton.style.transform = 'rotate(360deg)';

    try {
        const quote = await fetchQuote();
        
        // 更新内容
        setTimeout(() => {
            quoteText.textContent = quote.text;
            quoteAuthor.textContent = `— ${quote.author}`;
            
            // 恢复正常显示
            quoteText.style.opacity = '1';
            quoteAuthor.style.opacity = '1';
        }, 300);

    } catch (error) {
        console.error('更新名言失败:', error);
        // 使用本地名言
        const fallbackQuote = localQuotes[Math.floor(Math.random() * localQuotes.length)];
        quoteText.textContent = fallbackQuote.text;
        quoteAuthor.textContent = `— ${fallbackQuote.author}`;
        quoteText.style.opacity = '1';
        quoteAuthor.style.opacity = '1';
    } finally {
        // 重置刷新按钮动画
        setTimeout(() => {
            refreshButton.style.transform = 'rotate(0deg)';
        }, 300);
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    // 初始显示一条名言
    updateQuote();

    // 为刷新按钮添加防抖的点击事件
    const refreshButton = document.querySelector('.refresh-quote');
    if (refreshButton) {
        const debouncedUpdate = debounce(updateQuote, 1000);
        refreshButton.addEventListener('click', debouncedUpdate);
    }

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .quote-text, .quote-author {
            transition: opacity 0.3s ease;
        }
        .refresh-quote svg {
            transition: transform 0.3s ease;
        }
        .refresh-quote {
            cursor: pointer;
        }
        .refresh-quote:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
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

// 添加截止时间检查功能（移除通知逻辑）
function checkDeadlines() {
    const now = new Date().getTime();
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    
    todos.forEach(todo => {
        if (todo.deadline && !todo.completed && !todo.notified) {
            const timeLeft = todo.deadline - now;
            const hoursLeft = timeLeft / (1000 * 60 * 60);
            
            // 如果距离截止时间小于1小时且未完成，只标记为已通知
            // 不再发送系统通知
            if (hoursLeft > 0 && hoursLeft <= 1) {
                todo.notified = true;
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
    
    // 仍保留检查截止时间功能，但已移除通知
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

// 测试代码是否正常加载
console.log('脚本已加载');