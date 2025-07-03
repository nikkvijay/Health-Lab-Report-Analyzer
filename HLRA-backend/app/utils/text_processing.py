import re
from typing import List

def clean_text(text: str) -> str:
    """Clean extracted text"""
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters that might interfere with parsing
    text = re.sub(r'[^\w\s\.\-\(\)/:]', ' ', text)
    
    # Remove excessive line breaks
    text = re.sub(r'\n\s*\n', '\n', text)
    
    return text.strip()

def split_into_lines(text: str) -> List[str]:
    """Split text into meaningful lines"""
    if not text:
        return []
    
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if line and len(line) > 2:  # Ignore very short lines
            cleaned_lines.append(line)
    
    return cleaned_lines

def normalize_units(unit: str) -> str:
    """Normalize unit strings"""
    if not unit:
        return ""
    
    unit = unit.lower().strip()
    
    # Common unit normalizations
    normalizations = {
        'mg%': 'mg/dl',
        'gm%': 'g/dl',
        'gm/dl': 'g/dl',
        'gms/dl': 'g/dl',
        'µmol/l': 'umol/l',
        'μmol/l': 'umol/l',
        'iu/l': 'U/L',
        'units/l': 'U/L',
        'µiu/ml': 'mIU/L',
        'μiu/ml': 'mIU/L',
        'miu/l': 'mIU/L'
    }
    
    return normalizations.get(unit, unit)