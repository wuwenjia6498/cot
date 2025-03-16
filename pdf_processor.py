import os
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
import fitz  # PyMuPDF

class PDFProcessor:
    @staticmethod
    def merge_pdfs(file_paths, output_path):
        """合并多个PDF文件"""
        merger = PdfMerger()
        
        for path in file_paths:
            merger.append(path)
            
        merger.write(output_path)
        merger.close()
        
        return output_path
    
    @staticmethod
    def split_pdf(file_path, pages, output_path):
        """分割PDF文件"""
        pdf = PdfReader(file_path)
        writer = PdfWriter()
        
        for page_num in pages:
            writer.add_page(pdf.pages[page_num])
            
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
            
        return output_path
    
    @staticmethod
    def compress_pdf(file_path, output_path, quality=70):
        """压缩PDF文件"""
        pdf = fitz.open(file_path)
        for i in range(pdf.page_count):
            page = pdf[i]
            for img in page.get_images():
                # 压缩图片逻辑
                pass
                
        pdf.save(output_path)
        pdf.close()
        
        return output_path
    
    # 其他PDF处理方法... 