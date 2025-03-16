// 天气API配置
const API_KEY = ''; // 需要填入OpenWeatherMap API密钥
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM元素
const weatherIcon = document.querySelector('.weather-strip .weather-icon');
const weatherLocation = document.querySelector('.weather-strip .weather-location');
const weatherTemp = document.querySelector('.weather-strip .weather-temp');
const weatherDesc = document.querySelector('.weather-strip .weather-desc');
const weatherFeel = document.querySelector('.weather-strip .weather-feel');
const forecastDays = document.querySelectorAll('.forecast-day .day-temp');

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 尝试获取用户位置
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherData(latitude, longitude);
            },
            (error) => {
                console.error('获取位置失败:', error);
                // 默认显示北京天气
                getWeatherByCity('北京');
            }
        );
    } else {
        console.error('浏览器不支持地理位置功能');
        getWeatherByCity('北京');
    }
});

// 扩展天气数据处理
async function getWeatherData(lat, lon) {
    try {
        // 获取基础天气数据
        const weatherResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn&appid=${API_KEY}`
        );
        
        // 获取空气质量数据
        const airQualityResponse = await fetch(
            `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        
        // 获取15天预报数据
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast/daily?lat=${lat}&lon=${lon}&cnt=15&units=metric&lang=zh_cn&appid=${API_KEY}`
        );

        const [weather, airQuality, forecast] = await Promise.all([
            weatherResponse.json(),
            airQualityResponse.json(),
            forecastResponse.json()
        ]);

        return { weather, airQuality, forecast };
    } catch (error) {
        console.error('获取天气数据失败:', error);
        return null;
    }
}

// 根据城市名称获取天气
async function getWeatherByCity(city) {
    try {
        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&units=metric&lang=zh_cn&appid=${API_KEY}`
        );
        
        if (!currentResponse.ok) throw new Error('无法获取天气数据');
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&units=metric&lang=zh_cn&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) throw new Error('无法获取天气预报数据');
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(currentData, forecastData);
    } catch (error) {
        console.error('获取天气失败:', error);
        displayMockData();
    }
}

// 显示天气数据
function displayWeatherData(current, forecast) {
    // 更新当前天气
    weatherTemp.textContent = `${Math.round(current.main.temp)}°C`;
    weatherFeel.textContent = `体感 ${Math.round(current.main.feels_like)}°C`;
    weatherDesc.textContent = current.weather[0].description;
    weatherLocation.textContent = current.name;
    updateWeatherIcon(current.weather[0].id);
    
    // 更新未来天气预报
    const today = new Date().setHours(0, 0, 0, 0);
    let forecastIndex = 0;
    
    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.setHours(0, 0, 0, 0);
        
        if (day > today && forecastIndex < 2) {
            forecastDays[forecastIndex].textContent = `${Math.round(item.main.temp)}°C`;
            forecastIndex++;
        }
    });
}

// 显示模拟数据
function displayMockData() {
    weatherTemp.textContent = '25°C';
    weatherFeel.textContent = '体感 25°C';
    weatherDesc.textContent = '晴朗';
    weatherLocation.textContent = '北京';
    updateWeatherIcon(800);
    
    forecastDays[0].textContent = '24°C';
    forecastDays[1].textContent = '26°C';
}

// 更新天气图标
function updateWeatherIcon(weatherId) {
    // 根据天气代码更新SVG图标
    let iconSvg = '';
    
    if (weatherId >= 200 && weatherId < 300) {
        // 雷雨图标
        iconSvg = `<svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22c0-5.523 4.477-10 10-10s10 4.477 10 10h4c0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6h-30c-3.314 0-6-2.686-6-6s2.686-6 6-6h0z" fill="#78909C"/>
            <path d="M20 28l-4 8h6l-2 8 10-12h-6l2-4h-6z" fill="#F9D71C" stroke="#F9D71C" stroke-width="1"/>
        </svg>`;
    } else if (weatherId >= 300 && weatherId < 600) {
        // 雨天图标
        iconSvg = `<svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 20c0-4.418 3.582-8 8-8s8 3.582 8 8h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-20c-2.21 0-4-1.79-4-4s1.79-4 4-4z" fill="#90CAF9"/>
            <path d="M16 32l-2 6M24 32l-2 6M32 32l-2 6" stroke="#64B5F6" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
    } else if (weatherId >= 600 && weatherId < 700) {
        // 雪天图标
        iconSvg = `<svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 20c0-4.418 3.582-8 8-8s8 3.582 8 8h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-20c-2.21 0-4-1.79-4-4s1.79-4 4-4z" fill="#B0BEC5"/>
            <circle cx="16" cy="36" r="2" fill="white"/>
            <circle cx="24" cy="36" r="2" fill="white"/>
            <circle cx="32" cy="36" r="2" fill="white"/>
        </svg>`;
    } else if (weatherId === 800) {
        // 晴天图标
        iconSvg = `<svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="12" fill="#F9D71C"/>
            <path d="M24 6v6M24 36v6M6 24h6M36 24h6M12 12l4 4M32 32l4 4M12 36l4-4M32 16l4-4" stroke="#F9D71C" stroke-width="2"/>
        </svg>`;
    } else {
        // 多云图标
        iconSvg = `<svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="8" fill="#F9D71C"/>
            <path d="M12 28c0-4.418 3.582-8 8-8h8c4.418 0 8 3.582 8 8s-3.582 8-8 8h-8c-4.418 0-8-3.582-8-8z" fill="#BBDEFB"/>
        </svg>`;
    }
    
    weatherIcon.innerHTML = iconSvg;
}

// 计算穿衣指数
function calculateClothingIndex(temp, humidity) {
    if (temp >= 30) return '清凉';
    if (temp >= 20) return '舒适';
    if (temp >= 10) return '较凉';
    return '保暖';
}

// 更新天气显示
function updateWeatherDisplay(data) {
    // 更新基础天气信息
    document.querySelector('.weather-temp').textContent = `${Math.round(data.weather.main.temp)}°C`;
    document.querySelector('.weather-feel').textContent = `体感 ${Math.round(data.weather.main.feels_like)}°C`;
    document.querySelector('.weather-desc').textContent = data.weather.weather[0].description;
    
    // 更新天气指数
    const indices = document.querySelectorAll('.weather-index .index-value');
    indices[0].textContent = getAQILevel(data.airQuality.list[0].main.aqi);  // 空气质量
    indices[1].textContent = `${data.weather.main.humidity}%`;  // 湿度
    indices[2].textContent = calculateClothingIndex(data.weather.main.temp, data.weather.main.humidity);  // 穿衣指数
    indices[3].textContent = getUVIndex(data.weather.clouds.all);  // 紫外线指数
}

// 获取空气质量等级描述
function getAQILevel(aqi) {
    const levels = ['优', '良', '轻度污染', '中度污染', '重度污染', '严重污染'];
    return levels[aqi - 1] || '未知';
}

// 获取紫外线指数
function getUVIndex(clouds) {
    if (clouds < 30) return '强';
    if (clouds < 70) return '中等';
    return '弱';
}

// 展开/收起更多天气预报
function toggleForecast() {
    const forecastDays = document.querySelector('.forecast-days');
    const expandBtn = document.querySelector('.forecast-expand');
    
    if (forecastDays.classList.contains('expanded')) {
        forecastDays.classList.remove('expanded');
        expandBtn.innerHTML = '查看更多预报 <svg>...</svg>';
    } else {
        forecastDays.classList.add('expanded');
        expandBtn.innerHTML = '收起预报 <svg>...</svg>';
        // 加载更多预报数据
        loadMoreForecast();
    }
} 