#!/usr/bin/env python
"""
图片转换服务器启动脚本
自动检查依赖并启动服务器
"""

import sys
import subprocess
import os
import time
import webbrowser
import socket
import requests
from contextlib import closing

def check_port(port):
    """检查端口是否被占用"""
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        return sock.connect_ex(('localhost', port)) == 0

def check_dependencies():
    """检查必要的Python包是否已安装"""
    required_packages = {
        'flask': 'Flask',
        'pillow': 'PIL',
        'flask-cors': 'flask_cors',
        'requests': 'requests'
    }
    
    missing_packages = []
    
    for package, import_name in required_packages.items():
        try:
            __import__(import_name)
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def install_package(package):
    """安装指定的Python包"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError:
        return False

def wait_for_server(url, timeout=30):
    """等待服务器启动"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    return False

def main():
    """主函数"""
    print("="*50)
    print("图片转换服务器启动工具")
    print("="*50)
    
    # 检查端口
    if check_port(5000):
        print("\n错误: 端口 5000 已被占用!")
        print("请确保没有其他程序正在使用该端口")
        print("您可以:")
        print("1. 关闭使用该端口的其他程序")
        print("2. 在任务管理器中结束占用端口的进程")
        return
    
    print("\n1. 检查依赖...")
    
    # 检查依赖
    missing_packages = check_dependencies()
    if missing_packages:
        print("\n发现缺少的依赖包:")
        for package in missing_packages:
            print(f"  - {package}")
        
        # 询问是否安装
        response = input("\n是否自动安装这些依赖? (y/n): ")
        if response.lower() == 'y':
            print("\n开始安装依赖...")
            for package in missing_packages:
                print(f"\n正在安装 {package}...")
                if install_package(package):
                    print(f"  - {package} 安装成功")
                else:
                    print(f"  - {package} 安装失败")
                    print("\n请手动运行以下命令安装依赖:")
                    print(f"pip install {' '.join(missing_packages)}")
                    return
        else:
            print("\n请手动安装所需依赖后再运行此脚本")
            return
    
    print("\n2. 检查目录结构...")
    
    # 确保必要的目录存在
    directories = ['uploads', 'results', 'assets/fonts']
    for directory in directories:
        dir_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), directory)
        os.makedirs(dir_path, exist_ok=True)
        print(f"  - 确保目录存在: {directory}")
    
    print("\n3. 启动服务器...")
    
    try:
        # 启动服务器
        server_process = subprocess.Popen(
            [sys.executable, "app.py"],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        # 等待服务器启动
        print("\n等待服务器启动...")
        if wait_for_server('http://localhost:5000/api/image/status/test'):
            print("\n✓ 服务器已成功启动!")
            print("\n现在您可以:")
            print("1. 访问 http://localhost:5000 使用图片转换功能")
            print("2. 打开debug.html页面进行连接测试")
            
            # 询问是否打开调试页面
            response = input("\n是否打开调试页面? (y/n): ")
            if response.lower() == 'y':
                debug_path = os.path.join(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    'image-converter',
                    'debug.html'
                )
                webbrowser.open('file://' + debug_path)
        else:
            print("\n! 服务器启动超时")
            print("可能的原因:")
            print("1. 端口 5000 被其他程序占用")
            print("2. Python环境配置问题")
            print("3. 防火墙阻止了连接")
            print("\n请尝试:")
            print("1. 检查端口占用情况")
            print("2. 检查防火墙设置")
            print("3. 以管理员权限运行此脚本")
            return
        
        print("\n按 Ctrl+C 停止服务器")
        server_process.wait()
        
    except KeyboardInterrupt:
        print("\n正在停止服务器...")
        server_process.terminate()
        print("服务器已停止")
    except Exception as e:
        print(f"\n启动服务器时出错: {str(e)}")
        print("请确保:")
        print("1. 端口 5000 未被占用")
        print("2. 您有足够的权限运行服务器")
        print("3. 防火墙未阻止Python访问网络")

if __name__ == '__main__':
    main() 