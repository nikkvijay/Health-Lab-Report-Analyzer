import pytesseract
from PIL import Image
import PyPDF2
import pdfplumber
import io
import os
import tempfile
from typing import Optional, List
from pdf2image import convert_from_path, convert_from_bytes
from app.core.config import settings
from app.core.exceptions import FileUploadError
import logging

logger = logging.getLogger(__name__)
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
          try:
              # Convert to RGB if necessary
              if image.mode != 'RGB':
                  image = image.convert('RGB')

              # Convert to grayscale for better contrast
              image = image.convert('L')

              # Resize if image is too small (OCR works better with higher resolution)
              width, height = image.size
              if width < 1200 or height < 1200:
                  scale_factor = max(1200/width, 1200/height)
                  new_width = int(width * scale_factor)
                  new_height = int(height * scale_factor)
                  image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                  logger.debug(f"Resized image from {width}x{height} to {new_width}x{new_height}")

              # Apply image enhancements for better OCR
              try:
                  from PIL import ImageEnhance, ImageFilter
                  
                  # Increase contrast
                  enhancer = ImageEnhance.Contrast(image)
                  image = enhancer.enhance(1.2)
                  
                  # Increase sharpness
                  enhancer = ImageEnhance.Sharpness(image)
                  image = enhancer.enhance(1.1)
                  
                  # Apply slight denoising
                  image = image.filter(ImageFilter.MedianFilter(size=3))
                  
              except ImportError:
                  # If PIL enhancements are not available, continue with basic image
                  logger.warning("PIL image enhancements not available")

              return image
              
          except Exception as e:
              logger.error(f"Image preprocessing failed: {str(e)}")
              # Return original image if preprocessing fails
              return image

      def _ocr_pdf_pages(self, file_path: str) -> str:
          """OCR PDF pages as images"""
          try:
              logger.info(f"Starting OCR processing for PDF: {file_path}")
              
              # Convert PDF pages to images
              images = convert_from_path(
                  file_path,
                  dpi=300,  # High DPI for better OCR results
                  first_page=1,
                  last_page=10,  # Limit to first 10 pages for performance
                  fmt='PNG',
                  thread_count=2  # Use 2 threads for faster processing
              )
              
              extracted_text = ""
              
              for i, image in enumerate(images):
                  logger.info(f"Processing page {i + 1} of {len(images)}")
                  
                  # Preprocess image for better OCR
                  processed_image = self._preprocess_image(image)
                  
                  # Extract text with optimized OCR settings
                  page_text = pytesseract.image_to_string(
                      processed_image,
                      config='--psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()/:-%+<>=[]'
                  )
                  
                  if page_text.strip():
                      extracted_text += f"\n--- Page {i + 1} ---\n"
                      extracted_text += page_text.strip() + "\n"
              
              logger.info(f"OCR completed. Extracted {len(extracted_text)} characters")
              return extracted_text.strip()
              
          except Exception as e:
              logger.error(f"OCR processing failed for {file_path}: {str(e)}")
              return f"OCR processing failed: {str(e)}"

ocr_service = OCRService()