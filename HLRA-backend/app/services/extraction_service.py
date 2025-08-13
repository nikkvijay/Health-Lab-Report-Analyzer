import re
import uuid
from typing import List, Dict, Tuple, Optional
from app.models.health_data import HealthParameter, ParameterStatus, ParameterCategory

class ExtractionService:
      def __init__(self):
          self.parameter_patterns = self._load_parameter_patterns()
          self.reference_ranges = self._load_reference_ranges()
          self.unit_normalizations = self._load_unit_normalizations()

      def extract_parameters(self, text: str) -> List[HealthParameter]:
          """Extract health parameters from text"""
          parameters = []
          lines = text.split('\n')

          for line in lines:
              line = line.strip()
              if not line or len(line) < 5:
                  continue

              # Try to match parameter patterns
              for pattern_name, pattern_info in self.parameter_patterns.items():
                  pattern = pattern_info["pattern"]
                  category = pattern_info.get("category", ParameterCategory.BLOOD)

                  match = re.search(pattern, line, re.IGNORECASE)
                  if match:
                      param = self._create_parameter(pattern_name, match, line, category)
                      if param:
                          parameters.append(param)
                          break  # Don't match multiple patterns for same line

          return self._deduplicate_parameters(parameters)

      def _load_parameter_patterns(self) -> Dict[str, Dict]:
          """Load regex patterns for common health parameters"""
          return {
              "glucose": {
                  "pattern": r"glucose.*?(\d+\.?\d*)\s*(mg/dl|mmol/l|mg%)?",
                  "category": ParameterCategory.BLOOD
              },
              "cholesterol_total": {
                  "pattern": r"(?:total\s+)?cholesterol.*?(\d+\.?\d*)\s*(mg/dl|mmol/l)?",
                  "category": ParameterCategory.LIPID
              },
              "cholesterol_ldl": {
                  "pattern": r"ldl.*?cholesterol.*?(\d+\.?\d*)\s*(mg/dl|mmol/l)?",
                  "category": ParameterCategory.LIPID
              },
              "cholesterol_hdl": {
                  "pattern": r"hdl.*?cholesterol.*?(\d+\.?\d*)\s*(mg/dl|mmol/l)?",
                  "category": ParameterCategory.LIPID
              },
              "triglycerides": {
                  "pattern": r"triglycerides.*?(\d+\.?\d*)\s*(mg/dl|mmol/l)?",
                  "category": ParameterCategory.LIPID
              },
              "hemoglobin": {
                  "pattern": r"h[ae]moglobin.*?(\d+\.?\d*)\s*(g/dl|g/l|gm%)?",
                  "category": ParameterCategory.BLOOD
              },
              "hematocrit": {
                  "pattern": r"hematocrit.*?(\d+\.?\d*)\s*(%|percent)?",
                  "category": ParameterCategory.BLOOD
              },
              "blood_pressure_systolic": {
                  "pattern": r"(?:blood pressure|bp).*?(\d+)/\d+\s*(mmhg)?",
                  "category": ParameterCategory.BLOOD
              },
              "blood_pressure_diastolic": {
                  "pattern": r"(?:blood pressure|bp).*?\d+/(\d+)\s*(mmhg)?",
                  "category": ParameterCategory.BLOOD
              },
              "creatinine": {
                  "pattern": r"creatinine.*?(\d+\.?\d*)\s*(mg/dl|umol/l|µmol/l)?",
                  "category": ParameterCategory.KIDNEY
              },
              "bun": {
                  "pattern": r"(?:bun|urea).*?(\d+\.?\d*)\s*(mg/dl|mmol/l)?",
                  "category": ParameterCategory.KIDNEY
              },
              "alt": {
                  "pattern": r"(?:alt|alat|sgpt).*?(\d+\.?\d*)\s*(u/l|iu/l)?",
                  "category": ParameterCategory.LIVER
              },
              "ast": {
                  "pattern": r"(?:ast|asat|sgot).*?(\d+\.?\d*)\s*(u/l|iu/l)?",
                  "category": ParameterCategory.LIVER
              },
              "platelets": {
                  "pattern": r"platelets.*?(\d+\.?\d*)\s*(lakhs?|/cumm|x10\^3)?",
                  "category": ParameterCategory.BLOOD
              },
              "wbc": {
                  "pattern": r"(?:wbc|white blood cells?).*?(\d+\.?\d*)\s*(thousands?|/cumm|x10\^3)?",
                  "category": ParameterCategory.BLOOD
              },
              "rbc": {
                  "pattern": r"(?:rbc|red blood cells?).*?(\d+\.?\d*)\s*(millions?|/cumm|x10\^6)?",
                  "category": ParameterCategory.BLOOD
              },
              "vitamin_d": {
                  "pattern": r"vitamin\s*d.*?(\d+\.?\d*)\s*(ng/ml|nmol/l)?",
                  "category": ParameterCategory.VITAMIN
              },
              "vitamin_b12": {
                  "pattern": r"vitamin\s*b12.*?(\d+\.?\d*)\s*(pg/ml|pmol/l)?",
                  "category": ParameterCategory.VITAMIN
              },
              "tsh": {
                  "pattern": r"tsh.*?(\d+\.?\d*)\s*(miu/l|µiu/ml)?",
                  "category": ParameterCategory.HORMONE
              }
          }

      def _load_reference_ranges(self) -> Dict[str, Dict]:
          """Load normal reference ranges for parameters"""
          return {
              "glucose": {"min": 70, "max": 100, "unit": "mg/dl"},
              "cholesterol_total": {"min": 0, "max": 200, "unit": "mg/dl"},
              "cholesterol_ldl": {"min": 0, "max": 100, "unit": "mg/dl"},
              "cholesterol_hdl": {"min": 40, "max": 999, "unit": "mg/dl"},
              "triglycerides": {"min": 0, "max": 150, "unit": "mg/dl"},
              "hemoglobin": {"min": 12.0, "max": 16.0, "unit": "g/dl"},
              "hematocrit": {"min": 36, "max": 48, "unit": "%"},
              "blood_pressure_systolic": {"min": 90, "max": 120, "unit": "mmHg"},
              "blood_pressure_diastolic": {"min": 60, "max": 80, "unit": "mmHg"},
              "creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dl"},
              "bun": {"min": 7, "max": 20, "unit": "mg/dl"},
              "alt": {"min": 7, "max": 40, "unit": "U/L"},
              "ast": {"min": 10, "max": 40, "unit": "U/L"},
              "platelets": {"min": 1.5, "max": 4.5, "unit": "lakhs"},
              "wbc": {"min": 4.0, "max": 11.0, "unit": "thousands"},
              "rbc": {"min": 4.2, "max": 5.4, "unit": "millions"},
              "vitamin_d": {"min": 30, "max": 100, "unit": "ng/ml"},
              "vitamin_b12": {"min": 200, "max": 900, "unit": "pg/ml"},
              "tsh": {"min": 0.4, "max": 4.0, "unit": "mIU/L"}
          }

      def _load_unit_normalizations(self) -> Dict[str, str]:
          """Load unit normalizations"""
          return {
              "mg%": "mg/dl",
              "gm%": "g/dl",
              "µmol/l": "umol/l",
              "iu/l": "U/L",
              "µiu/ml": "mIU/L",
              "miu/l": "mIU/L"
          }

      def _create_parameter(
          self,
          param_name: str,
          match,
          original_line: str,
          category: ParameterCategory
      ) -> Optional[HealthParameter]:
          """Create HealthParameter object from regex match"""
          try:
              value_str = match.group(1)
              unit = match.group(2) if match.lastindex > 1 else None

              # Normalize unit
              if unit:
                  unit = unit.lower().strip()
                  unit = self.unit_normalizations.get(unit, unit)

              # Convert value to float if possible
              try:
                  value = float(value_str)
              except ValueError:
                  value = value_str

              # Determine status
              status = self._determine_status(param_name, value)

              # Format parameter name
              display_name = self._format_parameter_name(param_name)

              return HealthParameter(
                  id=str(uuid.uuid4()),
                  name=display_name,
                  value=value,
                  unit=unit,
                  reference_range=self._get_reference_range_string(param_name),
                  status=status,
                  category=category,
                  extracted_text=original_line
              )
          except Exception:
              return None

      def _determine_status(self, param_name: str, value) -> ParameterStatus:
          """Determine if parameter value is normal, high, or low"""
          if param_name not in self.reference_ranges:
              return ParameterStatus.NORMAL

          try:
              value_float = float(value)
              ref_range = self.reference_ranges[param_name]

              if value_float < ref_range["min"]:
                  # Check if critically low
                  if value_float < ref_range["min"] * 0.5:
                      return ParameterStatus.CRITICAL
                  return ParameterStatus.LOW
              elif value_float > ref_range["max"]:
                  # Check if critically high
                  if value_float > ref_range["max"] * 2:
                      return ParameterStatus.CRITICAL
                  return ParameterStatus.HIGH
              else:
                  return ParameterStatus.NORMAL
          except (ValueError, TypeError):
              return ParameterStatus.NORMAL

      def _get_reference_range_string(self, param_name: str) -> str:
          """Get reference range as string"""
          if param_name not in self.reference_ranges:
              return ""

          ref_range = self.reference_ranges[param_name]
          unit = ref_range.get("unit", "")
          return f"{ref_range['min']}-{ref_range['max']} {unit}".strip()

      def _format_parameter_name(self, param_name: str) -> str:
          """Format parameter name for display"""
          name_mappings = {
              "glucose": "Glucose",
              "cholesterol_total": "Total Cholesterol",
              "cholesterol_ldl": "LDL Cholesterol",
              "cholesterol_hdl": "HDL Cholesterol",
              "triglycerides": "Triglycerides",
              "hemoglobin": "Hemoglobin",
              "hematocrit": "Hematocrit",
              "blood_pressure_systolic": "Systolic BP",
              "blood_pressure_diastolic": "Diastolic BP",
              "creatinine": "Creatinine",
              "bun": "BUN",
              "alt": "ALT",
              "ast": "AST",
              "platelets": "Platelets",
              "wbc": "WBC Count",
              "rbc": "RBC Count",
              "vitamin_d": "Vitamin D",
              "vitamin_b12": "Vitamin B12",
              "tsh": "TSH"
          }
          return name_mappings.get(param_name, param_name.replace("_", " ").title())

      def _deduplicate_parameters(self, parameters: List[HealthParameter]) -> List[HealthParameter]:
          """Remove duplicate parameters based on name"""
          seen_names = set()
          unique_parameters = []

          for param in parameters:
              if param.name not in seen_names:
                  seen_names.add(param.name)
                  unique_parameters.append(param)

          return unique_parameters

extraction_service = ExtractionService()