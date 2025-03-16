document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const swapLangBtn = document.getElementById('swapLang');
    const clearSourceBtn = document.getElementById('clearSource');
    const clearTargetBtn = document.getElementById('clearTarget');
    const copyTargetBtn = document.getElementById('copyTarget');
    const speakSourceBtn = document.getElementById('speakSource');
    const speakTargetBtn = document.getElementById('speakTarget');
    const translateBtn = document.getElementById('translateBtn');

    // 朗读状态追踪
    let isSpeakingSource = false;
    let isSpeakingTarget = false;
    
    // 翻译请求超时控制
    let translationTimeout;
    
    // 使用Google翻译API作为备选
    const GOOGLE_TRANSLATE_BASE = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t";

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 获取语言的全名
    function getLanguageName(code) {
        const languages = {
            'auto': '自动检测',
            'zh': '中文',
            'en': '英语',
            'ja': '日语',
            'ko': '韩语',
            'fr': '法语',
            'de': '德语'
        };
        return languages[code] || code;
    }

    // 模拟翻译（当API不可用时使用）
    function mockTranslate(text, sourceCode, targetCode) {
        const source = sourceCode === 'auto' ? 'zh' : sourceCode; // 如果是自动检测，默认假设为中文
        
        // 获取语言名称用于显示
        const sourceLangName = getLanguageName(source);
        const targetLangName = getLanguageName(targetCode);
        
        // 通用单词词典 - 扩展更多语言
        const dictionaries = {
            'zh': {
                'en': {
                    '你好': 'Hello',
                    '谢谢': 'Thank you',
                    '早上好': 'Good morning',
                    '晚上好': 'Good evening',
                    '再见': 'Goodbye',
                    '我爱你': 'I love you',
                    '中国': 'China',
                    '美国': 'America',
                    '学习': 'Study',
                    '工作': 'Work',
                    '电脑': 'Computer',
                    '手机': 'Mobile phone',
                    '互联网': 'Internet',
                    '翻译': 'Translate',
                    '语言': 'Language',
                    '文本': 'Text',
                    '结果': 'Result'
                },
                'ja': {
                    '你好': 'こんにちは',
                    '谢谢': 'ありがとう',
                    '早上好': 'おはようございます',
                    '晚上好': 'こんばんは',
                    '再见': 'さようなら',
                    '中国': '中国',
                    '日本': '日本',
                    '学习': '勉強',
                    '工作': '仕事'
                },
                'ko': {
                    '你好': '안녕하세요',
                    '谢谢': '감사합니다',
                    '再见': '안녕히 가세요'
                },
                'fr': {
                    '你好': 'Bonjour',
                    '谢谢': 'Merci',
                    '再见': 'Au revoir'
                },
                'de': {
                    '你好': 'Hallo',
                    '谢谢': 'Danke',
                    '再见': 'Auf Wiedersehen'
                }
            },
            'en': {
                'zh': {
                    'Hello': '你好',
                    'Thank you': '谢谢',
                    'Good morning': '早上好',
                    'Good evening': '晚上好',
                    'Goodbye': '再见',
                    'I love you': '我爱你',
                    'China': '中国',
                    'America': '美国',
                    'Study': '学习',
                    'Work': '工作',
                    'Computer': '电脑',
                    'Mobile phone': '手机',
                    'Internet': '互联网',
                    'Translate': '翻译',
                    'Language': '语言',
                    'Text': '文本',
                    'Result': '结果'
                }
            }
        };
        
        // 检查是否有对应的字典
        if (dictionaries[source] && dictionaries[source][targetCode]) {
            const dictionary = dictionaries[source][targetCode];
            let translated = text;
            
            // 应用词典进行替换
            Object.keys(dictionary).forEach(key => {
                const regex = new RegExp(key, source === 'zh' ? 'g' : 'gi');
                translated = translated.replace(regex, dictionary[key]);
            });
            
            // 如果文本没有变化，添加提示
            if (translated === text) {
                return `[本地翻译: ${sourceLangName}→${targetLangName}] ${text}`;
            }
            
            return translated;
        }
        
        // 如果没有对应字典，返回原文并标注
        return `[无法本地翻译: ${sourceLangName}→${targetLangName}] ${text}`;
    }

    // 尝试使用Google翻译API作为备选
    async function googleTranslate(text, source, target) {
        try {
            const sl = source === 'auto' ? 'auto' : source;
            const tl = target;
            const url = `${GOOGLE_TRANSLATE_BASE}&sl=${sl}&tl=${tl}&q=${encodeURIComponent(text)}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            // Google翻译API返回的结果结构较复杂
            let translatedText = '';
            if (data && data[0]) {
                for (let i = 0; i < data[0].length; i++) {
                    if (data[0][i][0]) {
                        translatedText += data[0][i][0];
                    }
                }
            }
            
            return translatedText || null;
        } catch (error) {
            console.error('Google Translate API error:', error);
            return null;
        }
    }

    // 翻译功能
    async function translate() {
        const text = sourceText.value.trim();
        if (!text) {
            targetText.value = '';
            return;
        }
        
        const source = sourceLang.value;
        const target = targetLang.value;
        
        // 显示翻译中的状态以及语言方向
        const sourceName = getLanguageName(source);
        const targetName = getLanguageName(target);
        targetText.value = `翻译中...(${sourceName} → ${targetName})`;
        
        // 设置超时
        clearTimeout(translationTimeout);
        translationTimeout = setTimeout(() => {
            // 如果5秒内没有收到响应，尝试备选API或使用本地翻译
            tryBackupTranslation(text, source, target);
        }, 5000);

        try {
            // 尝试使用 LibreTranslate API
            const response = await fetch('https://libretranslate.de/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: source === 'auto' ? 'auto' : source,
                    target: target
                })
            });
            
            // 取消超时定时器
            clearTimeout(translationTimeout);

            if (!response.ok) {
                throw new Error(`API响应错误: ${response.status}`);
            }

            const data = await response.json();
            if (data.translatedText) {
                targetText.value = data.translatedText;
            } else {
                throw new Error('API返回数据格式错误');
            }
        } catch (error) {
            console.error('Translation error:', error);
            
            // 取消超时定时器
            clearTimeout(translationTimeout);
            
            // 尝试备选翻译方法
            tryBackupTranslation(text, source, target);
        }
    }
    
    // 尝试备选翻译方法
    async function tryBackupTranslation(text, source, target) {
        // 先尝试Google翻译API
        const googleResult = await googleTranslate(text, source, target);
        
        if (googleResult) {
            targetText.value = googleResult;
        } else {
            // 如果Google翻译也失败，使用本地模拟翻译
            const mockResult = mockTranslate(text, source, target);
            targetText.value = mockResult;
        }
    }

    // 添加点击翻译按钮事件
    translateBtn.addEventListener('click', translate);

    // 语言切换功能
    swapLangBtn.addEventListener('click', () => {
        if (sourceLang.value === 'auto') return;
        const temp = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = temp;
        
        // 交换文本
        const tempText = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = tempText;
    });

    // 清空源文本
    clearSourceBtn.addEventListener('click', () => {
        sourceText.value = '';
        targetText.value = '';
    });
    
    // 清空译文
    clearTargetBtn.addEventListener('click', () => {
        targetText.value = '';
    });

    // 复制翻译结果
    copyTargetBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(targetText.value).then(() => {
            const originalText = copyTargetBtn.textContent;
            copyTargetBtn.textContent = '已复制';
            setTimeout(() => {
                copyTargetBtn.textContent = '复制';
            }, 2000);
        });
    });

    // 语音朗读功能
    function speak(text, lang, button, isSpeakingFlag) {
        if ('speechSynthesis' in window) {
            // 如果正在朗读，则停止
            if (window[isSpeakingFlag]) {
                window.speechSynthesis.cancel();
                button.classList.remove('speaking');
                button.querySelector('.button-text').textContent = '朗读';
                window[isSpeakingFlag] = false;
                return;
            }
            
            // 开始朗读
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.onstart = () => {
                window[isSpeakingFlag] = true;
                button.classList.add('speaking');
                button.querySelector('.button-text').textContent = '停止';
            };
            utterance.onend = () => {
                window[isSpeakingFlag] = false;
                button.classList.remove('speaking');
                button.querySelector('.button-text').textContent = '朗读';
            };
            utterance.onerror = () => {
                window[isSpeakingFlag] = false;
                button.classList.remove('speaking');
                button.querySelector('.button-text').textContent = '朗读';
            };
            window.speechSynthesis.speak(utterance);
        }
    }

    speakSourceBtn.addEventListener('click', () => {
        speak(sourceText.value, sourceLang.value, speakSourceBtn, 'isSpeakingSource');
    });

    speakTargetBtn.addEventListener('click', () => {
        speak(targetText.value, targetLang.value, speakTargetBtn, 'isSpeakingTarget');
    });

    // 自动翻译功能（延迟更长时间）
    sourceText.addEventListener('input', debounce(() => {
        // 自动翻译只在输入较短文本时工作，避免大量API请求
        if (sourceText.value.length <= 100) {
            translate();
        }
    }, 1500)); // 增加延迟到1.5秒
    
    // 监听语言选择变化
    sourceLang.addEventListener('change', () => {
        if (sourceText.value.trim()) {
            translate();
        }
    });
    
    targetLang.addEventListener('change', () => {
        if (sourceText.value.trim()) {
            translate();
        }
    });
}); 