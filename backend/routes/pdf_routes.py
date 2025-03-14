from flask import Blueprint, request, jsonify, send_file, current_app
import os
from pdf_processor import PDFProcessor

pdf_bp = Blueprint('pdf', __name__, url_prefix='/api/pdf')

@pdf_bp.route('/merge', methods=['POST'])
def merge_pdfs():
    """合并PDF文件"""
    if 'files' not in request.json:
        return jsonify({'error': '没有指定文件'}), 400
        
    file_paths = request.json['files']
    output_filename = f"merged_{os.path.basename(file_paths[0])}"
    output_path = os.path.join(current_app.config['RESULT_FOLDER'], output_filename)
    
    try:
        result_path = PDFProcessor.merge_pdfs(file_paths, output_path)
        return jsonify({
            'message': 'PDF合并成功',
            'result': f"/download/{os.path.basename(result_path)}"
        })
    except Exception as e:
        return jsonify({'error': f'处理失败：{str(e)}'}), 500

@pdf_bp.route('/split', methods=['POST'])
def split_pdf():
    """分割PDF文件"""
    if 'file' not in request.json or 'pages' not in request.json:
        return jsonify({'error': '参数不完整'}), 400
        
    file_path = request.json['file']
    pages = request.json['pages']
    output_filename = f"split_{os.path.basename(file_path)}"
    output_path = os.path.join(current_app.config['RESULT_FOLDER'], output_filename)
    
    try:
        result_path = PDFProcessor.split_pdf(file_path, pages, output_path)
        return jsonify({
            'message': 'PDF分割成功',
            'result': f"/download/{os.path.basename(result_path)}"
        })
    except Exception as e:
        return jsonify({'error': f'处理失败：{str(e)}'}), 500

# 其他PDF处理路由...

@pdf_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """下载处理后的文件"""
    file_path = os.path.join(current_app.config['RESULT_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({'error': '文件不存在'}), 404 