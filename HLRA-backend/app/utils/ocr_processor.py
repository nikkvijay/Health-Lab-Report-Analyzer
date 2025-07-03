import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import os
import re
from typing import List, Dict
import logging

# Set Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class OCRProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from an image file."""
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            self.logger.error(f"Error processing image: {e}")
            raise

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Convert PDF to images and extract text."""
        try:
            pages = convert_from_path(pdf_path)
            text = ""
            for page in pages:
                text += pytesseract.image_to_string(page)
            return text
        except Exception as e:
            self.logger.error(f"Error processing PDF: {e}")
            raise

    def parse_lab_results(self, text: str) -> List[Dict]:
        """Parse the extracted text to identify lab test results."""
        results = []
        
        # Common patterns in lab reports
        patterns = {
            'test_pattern': r'(?P<test>[\w\s-]+):\s*(?P<value>[\d.]+)\s*(?P<unit>[\w/]+)',
            'range_pattern': r'Reference Range:\s*(?P<range>[\d.-]+)',
        }

        # Extract test results
        matches = re.finditer(patterns['test_pattern'], text)
        for match in matches:
            result = {
                'name': match.group('test').strip(),
                'value': float(match.group('value')),
                'unit': match.group('unit'),
                'reference_range': '',
                'status': 'normal'
            }
            
            # Look for reference range near the test result
            range_text = text[match.start():match.start()+200]
            range_match = re.search(patterns['range_pattern'], range_text)
            if range_match:
                result['reference_range'] = range_match.group('range')

            results.append(result)

        return results