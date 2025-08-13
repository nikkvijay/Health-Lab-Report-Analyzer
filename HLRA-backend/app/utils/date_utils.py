"""
Standardized date utilities for consistent date handling across the backend
Uses ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) as the standard
"""

from datetime import datetime, date, timezone
from typing import Optional, Union, Any
import logging

logger = logging.getLogger(__name__)

DateInput = Union[str, datetime, date, int, float, None]

def to_utc_datetime(dt_input: DateInput) -> Optional[datetime]:
    """
    Converts various date inputs to UTC datetime object
    
    Args:
        dt_input: Date input of various types
        
    Returns:
        UTC datetime object or None if invalid
    """
    if dt_input is None:
        return None
    
    try:
        if isinstance(dt_input, datetime):
            # If already datetime, ensure it's UTC
            if dt_input.tzinfo is None:
                # Assume it's local time and convert to UTC
                return dt_input.replace(tzinfo=timezone.utc)
            else:
                # Convert to UTC if not already
                return dt_input.astimezone(timezone.utc)
        
        elif isinstance(dt_input, date):
            # Convert date to datetime at midnight UTC
            return datetime.combine(dt_input, datetime.min.time(), timezone.utc)
        
        elif isinstance(dt_input, (int, float)):
            # Assume timestamp
            return datetime.fromtimestamp(dt_input, tz=timezone.utc)
        
        elif isinstance(dt_input, str):
            # Try to parse string
            return parse_iso_datetime(dt_input)
        
        else:
            logger.warning(f"Unsupported date type: {type(dt_input)}")
            return None
            
    except Exception as e:
        logger.warning(f"Invalid date provided to to_utc_datetime: {dt_input}, error: {e}")
        return None

def parse_iso_datetime(date_string: str) -> Optional[datetime]:
    """
    Parses ISO 8601 date strings to UTC datetime
    
    Args:
        date_string: ISO 8601 formatted date string
        
    Returns:
        UTC datetime object or None if invalid
    """
    if not date_string:
        return None
    
    try:
        # Remove any whitespace
        date_string = date_string.strip()
        
        # Handle various ISO formats
        formats = [
            "%Y-%m-%dT%H:%M:%S.%fZ",      # 2023-01-15T10:30:00.123Z
            "%Y-%m-%dT%H:%M:%SZ",         # 2023-01-15T10:30:00Z
            "%Y-%m-%dT%H:%M:%S.%f%z",     # 2023-01-15T10:30:00.123+00:00
            "%Y-%m-%dT%H:%M:%S%z",        # 2023-01-15T10:30:00+00:00
            "%Y-%m-%dT%H:%M:%S.%f",       # 2023-01-15T10:30:00.123
            "%Y-%m-%dT%H:%M:%S",          # 2023-01-15T10:30:00
            "%Y-%m-%d %H:%M:%S",          # 2023-01-15 10:30:00
            "%Y-%m-%d",                   # 2023-01-15
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_string, fmt)
                # If no timezone info, assume UTC
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt
            except ValueError:
                continue
        
        logger.warning(f"Unable to parse date string: {date_string}")
        return None
        
    except Exception as e:
        logger.warning(f"Error parsing date string {date_string}: {e}")
        return None

def to_iso_string(dt_input: DateInput) -> Optional[str]:
    """
    Converts date input to ISO 8601 string format
    
    Args:
        dt_input: Date input of various types
        
    Returns:
        ISO 8601 formatted string or None if invalid
    """
    dt = to_utc_datetime(dt_input)
    if dt is None:
        return None
    
    return dt.isoformat().replace('+00:00', 'Z')

def to_date_string(dt_input: DateInput) -> Optional[str]:
    """
    Converts date input to YYYY-MM-DD format
    
    Args:
        dt_input: Date input of various types
        
    Returns:
        Date string in YYYY-MM-DD format or None if invalid
    """
    dt = to_utc_datetime(dt_input)
    if dt is None:
        return None
    
    return dt.date().isoformat()

def calculate_age(birth_date: DateInput) -> Optional[int]:
    """
    Calculates age based on birth date
    
    Args:
        birth_date: Birth date input
        
    Returns:
        Age in years or None if invalid
    """
    birth_dt = to_utc_datetime(birth_date)
    if birth_dt is None:
        return None
    
    try:
        today = datetime.now(timezone.utc)
        age = today.year - birth_dt.year
        
        # Check if birthday has occurred this year
        if (today.month, today.day) < (birth_dt.month, birth_dt.day):
            age -= 1
        
        return max(0, age)
    except Exception as e:
        logger.warning(f"Error calculating age for {birth_date}: {e}")
        return None

def is_valid_date(dt_input: DateInput) -> bool:
    """
    Checks if the input is a valid date
    
    Args:
        dt_input: Date input to validate
        
    Returns:
        True if valid date, False otherwise
    """
    return to_utc_datetime(dt_input) is not None

def format_relative_time(dt_input: DateInput) -> str:
    """
    Formats datetime as relative time string (e.g., "2 hours ago")
    
    Args:
        dt_input: Date input
        
    Returns:
        Relative time string or empty string if invalid
    """
    dt = to_utc_datetime(dt_input)
    if dt is None:
        return ""
    
    try:
        now = datetime.now(timezone.utc)
        diff = now - dt
        
        total_seconds = int(diff.total_seconds())
        
        if total_seconds < 60:
            return "just now"
        
        intervals = [
            ('year', 31536000),
            ('month', 2592000),
            ('week', 604800),
            ('day', 86400),
            ('hour', 3600),
            ('minute', 60),
        ]
        
        for name, seconds in intervals:
            count = total_seconds // seconds
            if count >= 1:
                plural = 's' if count != 1 else ''
                return f"{count} {name}{plural} ago"
        
        return "just now"
        
    except Exception as e:
        logger.warning(f"Error formatting relative time for {dt_input}: {e}")
        return ""

def get_date_range_bounds(start_date: DateInput, end_date: DateInput) -> Optional[tuple[datetime, datetime]]:
    """
    Gets the datetime bounds for a date range
    
    Args:
        start_date: Start date input
        end_date: End date input
        
    Returns:
        Tuple of (start_datetime, end_datetime) or None if invalid
    """
    start_dt = to_utc_datetime(start_date)
    end_dt = to_utc_datetime(end_date)
    
    if start_dt is None or end_dt is None:
        return None
    
    # Set start to beginning of day
    start_dt = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Set end to end of day
    end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return (start_dt, end_dt)

def validate_birth_date(birth_date: DateInput) -> tuple[bool, Optional[str]]:
    """
    Validates a birth date
    
    Args:
        birth_date: Birth date to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if birth_date is None:
        return True, None  # Optional field
    
    birth_dt = to_utc_datetime(birth_date)
    if birth_dt is None:
        return False, "Invalid date format"
    
    # Check if date is not in the future
    now = datetime.now(timezone.utc)
    if birth_dt > now:
        return False, "Birth date cannot be in the future"
    
    # Check reasonable age limit (150 years)
    age = calculate_age(birth_dt)
    if age is None or age > 150:
        return False, "Birth date results in unrealistic age"
    
    return True, None

def validate_date_range(start_date: DateInput, end_date: DateInput) -> tuple[bool, Optional[str]]:
    """
    Validates a date range
    
    Args:
        start_date: Start date
        end_date: End date
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    start_dt = to_utc_datetime(start_date)
    end_dt = to_utc_datetime(end_date)
    
    if start_dt is None:
        return False, "Invalid start date format"
    
    if end_dt is None:
        return False, "Invalid end date format"
    
    if start_dt > end_dt:
        return False, "Start date must be before end date"
    
    return True, None

def get_current_utc() -> datetime:
    """
    Gets current UTC datetime
    
    Returns:
        Current UTC datetime
    """
    return datetime.now(timezone.utc)

def serialize_datetime(dt: Optional[datetime]) -> Optional[str]:
    """
    Serializes datetime for JSON responses
    
    Args:
        dt: Datetime object to serialize
        
    Returns:
        ISO 8601 string or None
    """
    if dt is None:
        return None
    
    return to_iso_string(dt)

def deserialize_datetime(dt_string: Optional[str]) -> Optional[datetime]:
    """
    Deserializes datetime from JSON requests
    
    Args:
        dt_string: ISO 8601 datetime string
        
    Returns:
        UTC datetime object or None
    """
    if not dt_string:
        return None
    
    return parse_iso_datetime(dt_string)