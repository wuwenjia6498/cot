from flask import Blueprint, request, jsonify, send_file, current_app
import os
import uuid
import time
import traceback
from werkzeug.utils import secure_filename
from PIL import Image, ImageDraw, ImageFont
import io
import zipfile
import shutil
import logging

# 设置日志记录
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建蓝图
image_bp = Blueprint('image', __name__, url_prefix='/api/image')

# 保存任务状态和转换结果
conversion_tasks = {}

# 允许的图片格式
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'}

def allowed_file(filename):
    """检查文件是否是允许的图片格式"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@image_bp.route('/convert', methods=['POST'])
def convert_image():
    """处理图片转换请求"""
    try:
        logger.info("收到图片转换请求")
        
        if 'files' not in request.files:
            logger.warning("没有找到files字段")
            return jsonify({'error': '没有文件'}), 400
            
        files = request.files.getlist('files')
        logger.info(f"收到 {len(files)} 个文件")
        
        if not files or files[0].filename == '':
            logger.warning("文件名为空")
            return jsonify({'error': '没有选择文件'}), 400
        
        # 获取转换参数
        target_format = request.form.get('format', 'jpg').lower()
        quality = int(request.form.get('quality', 85))
        
        # 获取水印参数
        watermark_text = request.form.get('watermarkText', '')
        watermark_position = request.form.get('watermarkPosition', 'bottomRight')
        watermark_opacity = int(request.form.get('watermarkOpacity', 50))
        watermark_rotation = int(request.form.get('watermarkRotation', 0))
        
        logger.info(f"转换参数: 格式={target_format}, 质量={quality}")
        logger.info(f"水印参数: 文本={watermark_text}, 位置={watermark_position}, 透明度={watermark_opacity}, 旋转={watermark_rotation}")
        
        # 验证格式
        if target_format not in ALLOWED_EXTENSIONS:
            logger.warning(f"不支持的格式: {target_format}")
            return jsonify({'error': f'不支持的格式: {target_format}'}), 400
        
        # 创建任务ID
        job_id = str(uuid.uuid4())
        logger.info(f"创建任务ID: {job_id}")
        
        # 创建任务目录
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], job_id)
        result_dir = os.path.join(current_app.config['RESULT_FOLDER'], job_id)
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(result_dir, exist_ok=True)
        
        # 初始化任务状态
        conversion_tasks[job_id] = {
            'status': 'processing',
            'progress': 0,
            'total_files': len(files),
            'processed_files': 0,
            'result': {
                'files': []
            },
            # 保存水印参数到任务状态中
            'watermark': {
                'text': watermark_text,
                'position': watermark_position,
                'opacity': watermark_opacity,
                'rotation': watermark_rotation
            }
        }
        
        # 启动后台处理
        process_images_async(job_id, files, upload_dir, result_dir, target_format, quality)
        
        return jsonify({
            'status': 'success',
            'message': '转换任务已创建',
            'jobId': job_id
        })
    except Exception as e:
        error_msg = f"图片转换请求处理失败: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({'error': error_msg}), 500

def process_images_async(job_id, files, upload_dir, result_dir, target_format, quality):
    """异步处理图片转换（模拟）"""
    try:
        file_count = len(files)
        processed_count = 0
        
        # 从任务状态中获取水印参数
        watermark_params = conversion_tasks[job_id].get('watermark', {})
        watermark_text = watermark_params.get('text', '')
        watermark_position = watermark_params.get('position', 'bottomRight')
        watermark_opacity = watermark_params.get('opacity', 50)
        watermark_rotation = watermark_params.get('rotation', 0)
        
        logger.info(f"开始处理水印，文本: {watermark_text}, 位置: {watermark_position}, 透明度: {watermark_opacity}, 旋转: {watermark_rotation}")
        
        # 保存原始文件
        file_paths = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                file_paths.append((file_path, filename))
        
        result_files = []
        
        # 处理每个文件
        for file_path, original_filename in file_paths:
            try:
                processed_count += 1
                progress = int((processed_count / file_count) * 100)
                conversion_tasks[job_id]['progress'] = progress
                
                # 打开图片并转换为RGBA模式
                img = Image.open(file_path).convert('RGBA')
                logger.info(f"打开图片: {original_filename}, 大小: {img.size}")
                
                # 添加水印（如果有水印文本）
                if watermark_text:
                    logger.info(f"正在添加水印到图片: {original_filename}")
                    img = add_watermark(img, watermark_text, watermark_position, watermark_opacity, watermark_rotation)
                    logger.info("水印添加完成")
                
                # 转换格式
                if target_format.lower() in ['jpg', 'jpeg']:
                    # 如果目标格式是JPG，需要处理透明背景
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[3])
                    else:
                        background.paste(img)
                    img = background
                
                # 生成新文件名
                name_without_ext = os.path.splitext(original_filename)[0]
                new_filename = f"{name_without_ext}.{target_format}"
                output_path = os.path.join(result_dir, new_filename)
                
                # 保存转换后的图片
                img.save(output_path, quality=quality)
                logger.info(f"图片已保存: {output_path}")
                
                # 生成URL
                file_url = f"/api/image/download/{job_id}/{new_filename}"
                thumb_url = f"/api/image/thumbnail/{job_id}/{new_filename}"
                
                result_files.append({
                    'name': new_filename,
                    'url': file_url,
                    'thumbnailUrl': thumb_url,
                    'size': os.path.getsize(output_path)
                })
                
            except Exception as e:
                logger.error(f"处理文件 {original_filename} 时出错: {str(e)}")
                logger.error(traceback.format_exc())
                
        if result_files:
            conversion_tasks[job_id]['status'] = 'completed'
            conversion_tasks[job_id]['result']['files'] = result_files
        else:
            conversion_tasks[job_id]['status'] = 'failed'
            conversion_tasks[job_id]['error'] = '没有成功转换任何文件'
            
    except Exception as e:
        conversion_tasks[job_id]['status'] = 'failed'
        conversion_tasks[job_id]['error'] = str(e)
        logger.error(f"转换失败: {str(e)}")
        logger.error(traceback.format_exc())

def add_watermark(image, text, position='bottomRight', opacity=50, rotation=0):
    """添加水印到图片
    Args:
        image: PIL Image对象
        text: 水印文字（支持多行，用\\n分隔）
        position: 位置 ('topLeft', 'topRight', 'center', 'bottomLeft', 'bottomRight')
        opacity: 不透明度 (0-100)
        rotation: 旋转角度 (0-360)
    """
    try:
        logger.info(f"开始添加水印: 文本={text}, 位置={position}, 透明度={opacity}, 旋转={rotation}")
        
        # 创建水印图层（使用更大的画布以适应旋转）
        padding_for_rotation = int(image.width * 0.2)  # 为旋转预留20%的空间
        watermark = Image.new('RGBA', 
                            (image.width + padding_for_rotation * 2, 
                             image.height + padding_for_rotation * 2),
                            (0, 0, 0, 0))
        draw = ImageDraw.Draw(watermark)
        
        # 计算字体大小
        font_size = min(image.width // 10, 200)  # 最大200像素
        font_size = max(font_size, 50)  # 最小50像素
        
        logger.info(f"计算的字体大小: {font_size}")
        
        # Windows系统中文字体路径
        windows_fonts = [
            'C:\\Windows\\Fonts\\msyh.ttc',     # 微软雅黑
            'C:\\Windows\\Fonts\\simhei.ttf',   # 黑体
            'C:\\Windows\\Fonts\\simsun.ttc',   # 宋体
            'C:\\Windows\\Fonts\\simkai.ttf',   # 楷体
            'C:\\Windows\\Fonts\\simfang.ttf'   # 仿宋
        ]
        
        # 尝试加载字体
        font = None
        for font_path in windows_fonts:
            try:
                if os.path.exists(font_path):
                    font = ImageFont.truetype(font_path, size=font_size)
                    logger.info(f"成功加载字体: {font_path}")
                    break
            except Exception as e:
                logger.warning(f"尝试加载字体失败 {font_path}: {str(e)}")
                continue
        
        if font is None:
            logger.error("无法加载任何中文字体")
            return image
            
        # 分割多行文字
        lines = text.split('\\n')
        
        # 计算多行文字的总高度和最大宽度
        total_height = 0
        max_width = 0
        line_heights = []
        line_widths = []
        
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            line_width = bbox[2] - bbox[0]
            line_height = bbox[3] - bbox[1]
            line_heights.append(line_height)
            line_widths.append(line_width)
            total_height += line_height
            max_width = max(max_width, line_width)
        
        # 计算水印位置（考虑旋转）
        padding = max(50, image.width // 20)
        
        # 计算中心点（考虑旋转填充）
        center_x = watermark.width // 2
        center_y = watermark.height // 2
        
        # 根据position计算基准位置
        if position == 'topLeft':
            base_x = padding_for_rotation + padding
            base_y = padding_for_rotation + padding
        elif position == 'topRight':
            base_x = watermark.width - padding_for_rotation - max_width - padding
            base_y = padding_for_rotation + padding
        elif position == 'center':
            base_x = center_x - max_width // 2
            base_y = center_y - total_height // 2
        elif position == 'bottomLeft':
            base_x = padding_for_rotation + padding
            base_y = watermark.height - padding_for_rotation - total_height - padding
        else:  # bottomRight
            base_x = watermark.width - padding_for_rotation - max_width - padding
            base_y = watermark.height - padding_for_rotation - total_height - padding
        
        # 调整不透明度
        opacity_value = int(255 * (opacity / 100))
        opacity_value = max(128, opacity_value)  # 确保最小透明度
        
        # 绘制每一行文字
        current_y = base_y
        for i, line in enumerate(lines):
            # 绘制文本阴影
            shadow_offset = max(3, font_size // 15)
            shadow_color = (0, 0, 0, opacity_value)
            for offset in range(1, shadow_offset + 1):
                draw.text((base_x + offset, current_y + offset), 
                         line, font=font, fill=shadow_color)
            
            # 绘制主文本
            text_color = (255, 255, 255, opacity_value)
            draw.text((base_x, current_y), line, font=font, fill=text_color)
            
            # 更新Y坐标到下一行
            current_y += line_heights[i]
        
        # 旋转水印
        if rotation != 0:
            watermark = watermark.rotate(rotation, expand=True, fillcolor=(0, 0, 0, 0))
        
        # 裁剪回原始大小并合并
        crop_box = (padding_for_rotation, padding_for_rotation,
                   padding_for_rotation + image.width,
                   padding_for_rotation + image.height)
        watermark = watermark.crop(crop_box)
        
        # 合并水印和原图
        result = Image.alpha_composite(image, watermark)
        logger.info("水印添加成功")
        return result
        
    except Exception as e:
        logger.error(f"添加水印失败: {str(e)}")
        logger.error(traceback.format_exc())
        return image  # 如果添加水印失败，返回原图

@image_bp.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """获取任务状态"""
    if job_id not in conversion_tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    return jsonify(conversion_tasks[job_id])

@image_bp.route('/download/<job_id>/<filename>', methods=['GET'])
def download_file(job_id, filename):
    """下载单个转换后的文件"""
    try:
        result_dir = os.path.join(current_app.config['RESULT_FOLDER'], job_id)
        file_path = os.path.join(result_dir, filename)
        
        logger.info(f"下载请求: {file_path}")
        
        if not os.path.exists(file_path):
            logger.warning(f"文件不存在: {file_path}")
            return jsonify({'error': '文件不存在'}), 404
        
        return send_file(file_path, as_attachment=True, download_name=filename)
    except Exception as e:
        error_msg = f"下载文件失败: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({'error': error_msg}), 500

@image_bp.route('/download-all/<job_id>', methods=['GET'])
def download_all(job_id):
    """创建并下载包含所有转换文件的ZIP包"""
    if job_id not in conversion_tasks or conversion_tasks[job_id]['status'] != 'completed':
        return jsonify({'error': '任务不存在或未完成'}), 404
    
    result_dir = os.path.join(current_app.config['RESULT_FOLDER'], job_id)
    zip_path = os.path.join(result_dir, 'converted_images.zip')
    
    # 创建ZIP文件
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for file_info in conversion_tasks[job_id]['result']['files']:
            file_name = file_info['name']
            file_path = os.path.join(result_dir, file_name)
            if os.path.exists(file_path):
                zipf.write(file_path, file_name)
    
    # 返回ZIP文件下载链接
    zip_url = f"/api/image/download-zip/{job_id}"
    return jsonify({'zipUrl': zip_url})

@image_bp.route('/download-zip/<job_id>', methods=['GET'])
def download_zip(job_id):
    """下载ZIP包"""
    result_dir = os.path.join(current_app.config['RESULT_FOLDER'], job_id)
    zip_path = os.path.join(result_dir, 'converted_images.zip')
    
    if not os.path.exists(zip_path):
        return jsonify({'error': 'ZIP文件不存在'}), 404
    
    return send_file(zip_path, as_attachment=True, download_name='converted_images.zip')

@image_bp.route('/cleanup/<job_id>', methods=['DELETE'])
def cleanup(job_id):
    """清理任务文件（可选，用于长期运行的服务）"""
    if job_id not in conversion_tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    # 删除任务目录
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], job_id)
    result_dir = os.path.join(current_app.config['RESULT_FOLDER'], job_id)
    
    if os.path.exists(upload_dir):
        shutil.rmtree(upload_dir)
    
    if os.path.exists(result_dir):
        shutil.rmtree(result_dir)
    
    # 移除任务状态
    if job_id in conversion_tasks:
        del conversion_tasks[job_id]
    
    return jsonify({'status': 'success', 'message': '任务已清理'})

# 添加定期清理过期任务的功能（在实际应用中使用）

# 创建缩略图路由
@image_bp.route('/thumbnail/<job_id>/<filename>', methods=['GET'])
def get_thumbnail(job_id, filename):
    """获取图片缩略图"""
    try:
        result_dir = os.path.join(current_app.config['RESULT_FOLDER'], job_id)
        file_path = os.path.join(result_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': '文件不存在'}), 404
        
        # 打开图片并创建缩略图
        with Image.open(file_path) as img:
            # 等比例缩放
            img.thumbnail((200, 200))
            img_io = io.BytesIO()
            # 保存为JPEG格式的缩略图
            if img.mode == 'RGBA':
                # 如果有透明通道，转换为RGB
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                background.save(img_io, 'JPEG', quality=70)
            else:
                img.save(img_io, 'JPEG', quality=70)
            img_io.seek(0)
        
        return send_file(img_io, mimetype='image/jpeg')
        
    except Exception as e:
        logger.error(f"获取缩略图失败: {str(e)}")
        return jsonify({'error': f'获取缩略图失败: {str(e)}'}), 500

@image_bp.route('/image/results/<path:filename>')
def serve_image(filename):
    """提供转换后的图片文件"""
    try:
        result_path = os.path.join('results', filename)
        return send_file(result_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 404 