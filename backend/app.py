from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
from pdf_processor import PDFProcessor
from routes.pdf_routes import pdf_bp  # 导入PDF路由蓝图

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['RESULT_FOLDER'] = 'results/'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB限制

# 注册蓝图
app.register_blueprint(pdf_bp)

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

if __name__ == '__main__':
    # 确保上传和结果目录存在
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['RESULT_FOLDER'], exist_ok=True)
    app.run(debug=True) 