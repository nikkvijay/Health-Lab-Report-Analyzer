import pytesseract
from PIL import Image
import PyPDF2
import pdfplumber
import io
import os
from typing import Optional
from app.core.config import settings
from app.core.exceptions import FileUploadError

class OCRService:
    def __init__(self):
        # Configure tesseract path if specified
        if settings.tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_path

    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from PDF or image file"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_ext == '.pdf':
                return self._extract_text_from_pdf(file_path)
            elif file_ext in ['.jpg', '.jpeg', '.png']:
                return self._extract_text_from_image(file_path)
            else:
                raise FileUploadError(f"Unsupported file type: {file_ext}")
        except Exception as e:
            raise FileUploadError(f"Text extraction failed: {str(e)}")

    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file using multiple methods"""
        text = ""
        
        # Try pdfplumber first (better for structured PDFs)
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception:
            pass
        
        # If pdfplumber didn't work well, try PyPDF2
        if len(text.strip()) < 50:  # If very little text extracted
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    text = ""
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception:
                pass
        
        # If still no good text, try OCR on PDF pages
        if len(text.strip()) < 50:
            text = self._ocr_pdf_pages(file_path)
        
        return text.strip()

    def _extract_text_from_image(self, file_path: str) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(file_path)
            # Preprocess image for better OCR
            image = self._preprocess_image(image)
            text = pytesseract.image_to_string(image, config='--psm 6')
            return text.strip()
        except Exception as e:
            raise FileUploadError(f"OCR failed: {str(e)}")

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results"""
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to grayscale
        image = image.convert('L')
        
        # Resize if image is too small
        width, height = image.size
        if width < 1000 or height < 1000:
            scale_factor = max(1000/width, 1000/height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        return image

    def _ocr_pdf_pages(self, file_path: str) -> str:
        """OCR PDF pages as images"""
        try:
            # This would require pdf2image library
            # For now, return empty string
            return ""
        except Exception:
            return ""

ocr_service = OCRService()