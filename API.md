# HLRA API Documentation

Complete API reference for the Health Lab Report Analyzer backend.

## 📋 Table of Contents

- [Base Information](#base-information)
- [Authentication](#authentication)
- [File Upload](#file-upload)
- [Data Extraction](#data-extraction)
- [Family Profiles](#family-profiles)
- [Reports](#reports)
- [Shared Reports](#shared-reports)
- [Statistics & Trends](#statistics--trends)
- [Notifications](#notifications)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## 🔗 Base Information

### Base URL
```
Production: https://your-backend-domain.render.com
Development: http://localhost:8000
```

### API Version
Current version: `v1`

All endpoints are prefixed with `/api/v1`

### Content Type
```
Content-Type: application/json
```

### Interactive Documentation
- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`

## 🔐 Authentication

### Overview
The API uses JWT (JSON Web Tokens) for authentication with access and refresh token pattern.

### Authentication Flow
1. **Register/Login** → Receive access + refresh tokens
2. **Include Bearer token** in Authorization header
3. **Refresh token** when access token expires

---

### POST `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Email/username already exists

---

### POST `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Validation errors

---

### POST `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### GET `/auth/me`

Get current user information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "user_id",
  "username": "johndoe",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 📁 File Upload

### POST `/upload/file`

Upload a health report file for processing.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <binary_file_data>
family_profile_id: "profile_id" (optional)
```

**Supported File Types:**
- PDF (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`)

**File Size Limit:** 10MB

**Response (201 Created):**
```json
{
  "id": "file_id",
  "filename": "lab_report.pdf",
  "content_type": "application/pdf",
  "size": 1024768,
  "upload_date": "2024-01-01T00:00:00Z",
  "family_profile_id": "profile_id",
  "status": "uploaded",
  "processing_status": "pending"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file type/size
- `413 Payload Too Large` - File exceeds size limit
- `415 Unsupported Media Type` - Unsupported file type

---

### GET `/upload/files`

Get list of uploaded files for the current user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `family_profile_id` (optional): Filter by family profile
- `status` (optional): Filter by processing status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "files": [
    {
      "id": "file_id",
      "filename": "lab_report.pdf",
      "content_type": "application/pdf",
      "size": 1024768,
      "upload_date": "2024-01-01T00:00:00Z",
      "family_profile_id": "profile_id",
      "status": "processed",
      "processing_status": "completed"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

---

### GET `/upload/file/{file_id}`

Get details of a specific uploaded file.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "file_id",
  "filename": "lab_report.pdf",
  "content_type": "application/pdf",
  "size": 1024768,
  "upload_date": "2024-01-01T00:00:00Z",
  "family_profile_id": "profile_id",
  "status": "processed",
  "processing_status": "completed",
  "extracted_data": {
    "text_content": "Lab report text...",
    "health_metrics": {...}
  }
}
```

---

### DELETE `/upload/file/{file_id}`

Delete an uploaded file.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

## 🔍 Data Extraction

### POST `/extraction/process`

Process an uploaded file using OCR and extract health data.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "file_id": "file_id",
  "extraction_options": {
    "ocr_enabled": true,
    "auto_categorize": true,
    "extract_metrics": true
  }
}
```

**Response (202 Accepted):**
```json
{
  "processing_id": "process_id",
  "status": "processing",
  "estimated_completion": "2024-01-01T00:05:00Z"
}
```

---

### GET `/extraction/results`

Get extraction results for processed files.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `file_id` (optional): Filter by specific file
- `family_profile_id` (optional): Filter by family profile
- `status` (optional): Filter by processing status

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "result_id",
      "file_id": "file_id",
      "processing_status": "completed",
      "extracted_text": "Lab report content...",
      "health_metrics": {
        "cholesterol": {
          "total": {"value": 200, "unit": "mg/dL", "reference_range": "<200"},
          "hdl": {"value": 45, "unit": "mg/dL", "reference_range": ">40"},
          "ldl": {"value": 130, "unit": "mg/dL", "reference_range": "<100"}
        },
        "blood_sugar": {
          "glucose": {"value": 95, "unit": "mg/dL", "reference_range": "70-99"}
        }
      },
      "categories": ["blood_work", "lipid_panel"],
      "processed_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET `/extraction/health-data`

Get processed health data with trend analysis.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `family_profile_id` (optional): Filter by family profile
- `metric_type` (optional): Filter by health metric type
- `date_from` (optional): Start date for filtering
- `date_to` (optional): End date for filtering

**Response (200 OK):**
```json
{
  "health_data": [
    {
      "id": "data_id",
      "family_profile_id": "profile_id",
      "report_date": "2024-01-01",
      "metrics": {
        "cholesterol_total": 200,
        "cholesterol_hdl": 45,
        "cholesterol_ldl": 130,
        "glucose": 95
      },
      "trends": {
        "cholesterol_total": {
          "current": 200,
          "previous": 210,
          "change": -10,
          "trend": "improving"
        }
      },
      "file_id": "file_id"
    }
  ]
}
```

## 👥 Family Profiles

### GET `/family-profiles`

Get list of family profiles for the current user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "profiles": [
    {
      "id": "profile_id",
      "name": "John Doe",
      "relationship": "self",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "medical_conditions": ["hypertension"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "reports_count": 5
    }
  ]
}
```

---

### POST `/family-profiles`

Create a new family profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "relationship": "spouse",
  "date_of_birth": "1992-05-15",
  "gender": "female",
  "medical_conditions": ["diabetes"],
  "notes": "Type 2 diabetes diagnosed 2020"
}
```

**Response (201 Created):**
```json
{
  "id": "profile_id",
  "name": "Jane Doe",
  "relationship": "spouse",
  "date_of_birth": "1992-05-15",
  "gender": "female",
  "medical_conditions": ["diabetes"],
  "notes": "Type 2 diabetes diagnosed 2020",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "reports_count": 0
}
```

---

### GET `/family-profiles/{profile_id}`

Get details of a specific family profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "profile_id",
  "name": "John Doe",
  "relationship": "self",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "medical_conditions": ["hypertension"],
  "notes": "Diagnosed with hypertension in 2020",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "reports_count": 5,
  "recent_reports": [...]
}
```

---

### PUT `/family-profiles/{profile_id}`

Update an existing family profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "medical_conditions": ["hypertension", "high_cholesterol"],
  "notes": "Added high cholesterol condition"
}
```

**Response (200 OK):**
```json
{
  "id": "profile_id",
  "name": "John Doe Updated",
  "relationship": "self",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "medical_conditions": ["hypertension", "high_cholesterol"],
  "notes": "Added high cholesterol condition",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### DELETE `/family-profiles/{profile_id}`

Delete a family profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

## 📊 Reports

### GET `/reports`

Get list of health reports for the current user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `family_profile_id` (optional): Filter by family profile
- `date_from` (optional): Start date filter
- `date_to` (optional): End date filter
- `category` (optional): Filter by report category
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

**Response (200 OK):**
```json
{
  "reports": [
    {
      "id": "report_id",
      "title": "Annual Checkup - Lab Results",
      "family_profile_id": "profile_id",
      "report_date": "2024-01-15",
      "category": "annual_checkup",
      "status": "reviewed",
      "file_id": "file_id",
      "key_findings": [
        "Cholesterol levels normal",
        "Blood sugar slightly elevated"
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

### GET `/reports/{report_id}`

Get detailed information about a specific report.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "report_id",
  "title": "Annual Checkup - Lab Results",
  "family_profile_id": "profile_id",
  "report_date": "2024-01-15",
  "category": "annual_checkup",
  "status": "reviewed",
  "file_id": "file_id",
  "key_findings": [
    "Cholesterol levels normal",
    "Blood sugar slightly elevated"
  ],
  "health_metrics": {...},
  "extracted_text": "Full report text...",
  "notes": "Patient notes...",
  "sharing_enabled": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 🔗 Shared Reports

### POST `/shared-reports`

Create a shareable link for a report.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "report_id": "report_id",
  "expires_at": "2024-12-31T23:59:59Z",
  "access_type": "view_only",
  "password_protected": false,
  "allowed_views": 10
}
```

**Response (201 Created):**
```json
{
  "id": "share_id",
  "share_url": "https://app.hlra.com/shared/abc123xyz",
  "expires_at": "2024-12-31T23:59:59Z",
  "access_type": "view_only",
  "password_protected": false,
  "allowed_views": 10,
  "current_views": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### GET `/shared-reports/{share_id}`

Access a shared report (public endpoint).

**Query Parameters:**
- `password` (optional): Required if password protected

**Response (200 OK):**
```json
{
  "report": {
    "title": "Lab Results",
    "report_date": "2024-01-15",
    "family_member_name": "John D.",
    "health_metrics": {...},
    "key_findings": [...]
  },
  "sharing_info": {
    "shared_by": "Dr. Smith",
    "shared_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

---

### PUT `/shared-reports/{share_id}`

Update sharing settings for a report.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "expires_at": "2024-06-30T23:59:59Z",
  "allowed_views": 20
}
```

**Response (200 OK):**
```json
{
  "id": "share_id",
  "share_url": "https://app.hlra.com/shared/abc123xyz",
  "expires_at": "2024-06-30T23:59:59Z",
  "allowed_views": 20,
  "current_views": 3,
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### DELETE `/shared-reports/{share_id}`

Revoke a shared report link.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

## 📈 Statistics & Trends

### GET `/stats/summary`

Get user statistics summary.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "total_reports": 25,
  "family_profiles": 4,
  "recent_uploads": 3,
  "shared_reports": 2,
  "health_metrics_tracked": [
    "cholesterol",
    "blood_sugar",
    "blood_pressure"
  ],
  "latest_report_date": "2024-01-15"
}
```

---

### GET `/trends/health-metrics`

Get health trend data over time.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `family_profile_id` (optional): Filter by family profile
- `metric_type` (required): Type of health metric
- `period` (optional): Time period (3m, 6m, 1y, 2y)

**Response (200 OK):**
```json
{
  "metric_type": "cholesterol_total",
  "period": "6m",
  "data_points": [
    {
      "date": "2023-07-01",
      "value": 220,
      "reference_range": "<200",
      "status": "high"
    },
    {
      "date": "2023-10-01",
      "value": 205,
      "reference_range": "<200",
      "status": "borderline"
    },
    {
      "date": "2024-01-01",
      "value": 195,
      "reference_range": "<200",
      "status": "normal"
    }
  ],
  "trend_analysis": {
    "direction": "improving",
    "change_percent": -11.4,
    "average_value": 206.7
  }
}
```

---

### GET `/trends/family-overview`

Get family health overview and trends.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "family_summary": [
    {
      "profile_id": "profile_id",
      "name": "John D.",
      "latest_report_date": "2024-01-15",
      "key_metrics": {
        "cholesterol": {"value": 195, "status": "normal", "trend": "improving"},
        "blood_sugar": {"value": 98, "status": "normal", "trend": "stable"}
      },
      "health_score": 85
    }
  ],
  "family_trends": {
    "overall_health_score": 82,
    "members_with_improvements": 2,
    "members_needing_attention": 1
  }
}
```

## 🔔 Notifications

### GET `/notifications`

Get user notifications.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `read` (optional): Filter by read status (true/false)
- `type` (optional): Filter by notification type
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "type": "report_processed",
      "title": "Lab Report Processed",
      "message": "Your lab report has been successfully processed and analyzed.",
      "data": {
        "report_id": "report_id",
        "file_name": "lab_results.pdf"
      },
      "read": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "unread_count": 3,
  "total": 15
}
```

---

### POST `/notifications/mark-read`

Mark notifications as read.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "notification_ids": ["notification_id1", "notification_id2"],
  "mark_all": false
}
```

**Response (200 OK):**
```json
{
  "marked_count": 2,
  "remaining_unread": 1
}
```

---

### DELETE `/notifications/{notification_id}`

Delete a specific notification.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

## ⚠️ Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": {
      "field_errors": {
        "email": ["Invalid email format"],
        "password": ["Password must be at least 8 characters"]
      }
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req_123456789"
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content returned
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `413 Payload Too Large` - File too large
- `415 Unsupported Media Type` - Unsupported file type
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - No valid token provided
- `TOKEN_EXPIRED` - Access token has expired
- `INVALID_TOKEN` - Token is invalid or malformed
- `VALIDATION_ERROR` - Request validation failed
- `FILE_TOO_LARGE` - Uploaded file exceeds size limit
- `UNSUPPORTED_FILE_TYPE` - File type not supported
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests from client
- `PROCESSING_ERROR` - Error during file processing

## 🚦 Rate Limiting

### Limits
- **Authentication endpoints**: 10 requests per minute
- **File upload**: 5 uploads per minute
- **General API**: 100 requests per minute
- **Shared report access**: 50 requests per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

When rate limit is exceeded:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again later.",
    "retry_after": 60
  }
}
```

## 💻 Examples

### Complete Authentication Flow

```python
import requests
import json

base_url = "https://your-backend-domain.render.com/api/v1"

# 1. Register user
register_data = {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123",
    "full_name": "John Doe"
}

response = requests.post(f"{base_url}/auth/register", json=register_data)
auth_data = response.json()
access_token = auth_data["access_token"]

# 2. Set up headers for authenticated requests
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# 3. Create family profile
profile_data = {
    "name": "John Doe",
    "relationship": "self",
    "date_of_birth": "1990-01-01",
    "gender": "male"
}

response = requests.post(f"{base_url}/family-profiles", 
                        json=profile_data, headers=headers)
profile = response.json()
profile_id = profile["id"]

# 4. Upload file
files = {"file": open("lab_report.pdf", "rb")}
upload_data = {"family_profile_id": profile_id}

response = requests.post(f"{base_url}/upload/file", 
                        files=files, data=upload_data, 
                        headers={"Authorization": f"Bearer {access_token}"})
file_info = response.json()
file_id = file_info["id"]

# 5. Process file
process_data = {
    "file_id": file_id,
    "extraction_options": {
        "ocr_enabled": True,
        "auto_categorize": True,
        "extract_metrics": True
    }
}

response = requests.post(f"{base_url}/extraction/process", 
                        json=process_data, headers=headers)
processing_info = response.json()

print("File uploaded and processing started!")
```

### JavaScript/TypeScript Example

```typescript
// API client setup
class HLRAApiClient {
  private baseUrl = 'https://your-backend-domain.render.com/api/v1';
  private accessToken: string | null = null;

  async login(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
    return data;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  async getFamilyProfiles() {
    const response = await fetch(`${this.baseUrl}/family-profiles`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async uploadFile(file: File, familyProfileId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (familyProfileId) {
      formData.append('family_profile_id', familyProfileId);
    }

    const response = await fetch(`${this.baseUrl}/upload/file`, {
      method: 'POST',
      headers: {'Authorization': `Bearer ${this.accessToken}`},
      body: formData
    });
    return response.json();
  }

  async getHealthTrends(profileId: string, metricType: string) {
    const params = new URLSearchParams({
      family_profile_id: profileId,
      metric_type: metricType,
      period: '6m'
    });

    const response = await fetch(`${this.baseUrl}/trends/health-metrics?${params}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }
}

// Usage
const client = new HLRAApiClient();
await client.login('user@example.com', 'password');
const profiles = await client.getFamilyProfiles();
console.log('Family profiles:', profiles);
```

---

This API documentation provides comprehensive coverage of all endpoints. For the most up-to-date interactive documentation, visit the `/docs` endpoint of your running API server.