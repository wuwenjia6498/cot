from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
from pdf_processor import PDFProcessor
from routes.pdf_routes import pdf_bp  # 导入PDF路由蓝图
from routes.image_routes import image_bp  # 导入图片路由蓝图
from flask_cors import CORS  # 导入CORS支持
import logging

app = Flask(__name__)
# 配置CORS，允许所有来源
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['RESULT_FOLDER'] = 'results/'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB限制

# 注册蓝图
app.register_blueprint(pdf_bp)
app.register_blueprint(image_bp)  # 注册图片处理蓝图

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """处理文件上传"""
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400
        
    files = request.files.getlist('file')
    filenames = []
    
    for file in files:
        if file.filename:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            filenames.append(filename)
    
    return jsonify({'message': '文件上传成功', 'files': filenames})

# 添加静态文件提供
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    """提供静态文件"""
    if path.startswith('api/'):
        return jsonify({'error': '找不到请求的资源'}), 404
        
    # 尝试提供静态文件
    try:
        return app.send_static_file(path)
    except:
        # 返回index.html以支持SPA路由
        return app.send_static_file('index.html')

# 添加错误处理
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "请求的资源不存在"}), 404

@app.errorhandler(500)
def server_error(e):
    app.logger.error(f"服务器错误: {str(e)}")
    return jsonify({"error": "服务器内部错误"}), 500

@app.route('/api/image/status/test', methods=['GET'])
def test_status():
    """测试API连接状态"""
    return jsonify({
        'status': 'ok',
        'message': '连接成功',
        'features': {
            'image_conversion': True,
            'pdf_support': True
        }
    })

if __name__ == '__main__':
    # 确保上传和结果目录存在
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['RESULT_FOLDER'], exist_ok=True)
    
    print("启动服务器...")
    print("上传目录:", os.path.abspath(app.config['UPLOAD_FOLDER']))
    print("结果目录:", os.path.abspath(app.config['RESULT_FOLDER']))
    
    # 在所有接口上监听
    app.run(debug=True, host='localhost', port=5000) 