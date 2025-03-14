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