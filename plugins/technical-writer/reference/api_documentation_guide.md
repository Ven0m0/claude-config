# API Documentation Template

## Endpoint Name

Brief description of what this endpoint does.

### HTTP Method and URL

```
METHOD /api/v1/resource
```

### Authentication

Describe authentication requirements.

### Request

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1    | string | Yes | Description of param1 |
| param2    | integer | No | Description of param2 |

#### Request Body Example

```json
{
  "field1": "value1",
  "field2": 123
}
```

### Response

#### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "id": "abc123",
    "field1": "value1"
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "status": "error",
  "message": "Invalid request parameters"
}
```

**401 Unauthorized**
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### Example Usage

#### cURL

```bash
curl -X METHOD https://api.example.com/api/v1/resource \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"field1": "value1"}'
```

#### Python

```python
import requests

url = "https://api.example.com/api/v1/resource"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
}
data = {"field1": "value1"}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### Notes

Additional notes, limitations, or considerations.
