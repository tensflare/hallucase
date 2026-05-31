# HalluCase API Reference

## Base URL

When running locally:

```
http://localhost:3457/api
```

## Endpoints

---

### Search Reports

```
GET /api/reports
```

Search and filter the hallucination registry.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Full-text search on title, description, and output |
| `hallucination_type` | string | Filter by type (see schema) |
| `severity` | string | Filter by severity level |
| `domain` | string | Filter by legal domain |
| `jurisdiction` | string | Filter by jurisdiction |
| `affected_model` | string | Filter by model name/provider |
| `verified` | boolean | Filter by verification status |
| `date_from` | ISO datetime | Filter by documented date >= |
| `date_to` | ISO datetime | Filter by documented date <= |
| `page` | number | Page number (default: 1) |
| `page_size` | number | Results per page (default: 20, max: 100) |

**Response (200):**

```json
{
  "total": 42,
  "page": 1,
  "page_size": 20,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "hc_id": "HC-000001",
      "title": "Fabricated Contract Clause in MSA",
      "...": "..."
    }
  ]
}
```

**Example:**

```bash
curl "http://localhost:3457/api/reports?q=fake+citation&severity=critical&page=1"
```

---

### Get Report

```
GET /api/reports/:id
```

Retrieve a single report by UUID or HC-ID.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Report UUID or HC-ID (e.g., `HC-000001`) |

**Response (200):**

Returns a single `HallucinationReport` object.

**Response (404):**

```json
{
  "error": "Report not found"
}
```

**Example:**

```bash
curl http://localhost:3457/api/reports/HC-000001
```

---

### Create Report

```
POST /api/reports
```

Submit a new hallucination report.

**Request Body:**

See [schema.md](schema.md) for full field descriptions. Required fields:

- `title` (string, 5-200 chars)
- `description` (string, min 20 chars)
- `hallucination_type` (enum)
- `domain` (string)
- `hallucinated_output` (string)
- `expected_correct_output` (string)

Optional fields with defaults: `severity` defaults to `medium`, `verified` defaults to `false`.

**Response (201):**

Returns the created `HallucinationReport` with generated `id`, `hc_id`, `created_at`, and `updated_at`.

**Response (400):**

```json
{
  "error": "Validation failed",
  "issues": [
    {
      "path": "title",
      "message": "String must contain at least 5 character(s)"
    }
  ]
}
```

**Example:**

```bash
curl -X POST http://localhost:3457/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fabricated Case Citation in Brief",
    "description": "AI generated a non-existent court case citation in a legal memorandum.",
    "hallucination_type": "fake_citation",
    "domain": "litigation",
    "severity": "high",
    "hallucinated_output": "Anderson v. TechCorp, 987 F.3d 456 (2025)",
    "expected_correct_output": "No such case exists.",
    "affected_models": [{"provider": "OpenAI", "model": "GPT-4"}]
  }'
```

---

### Update Report

```
PUT /api/reports/:id
```

Partially update an existing report.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Report UUID |

**Request Body:**

Any subset of `CreateReportInput` fields. Omitting `severity` and `verified` will keep existing values.

**Response (200):**

Returns the updated `HallucinationReport`.

**Response (404):**

```json
{
  "error": "Report not found"
}
```

**Example:**

```bash
curl -X PUT http://localhost:3457/api/reports/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"verified": true, "severity": "critical"}'
```

---

### Delete Report

```
DELETE /api/reports/:id
```

Remove a report from the registry.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Report UUID |

**Response (204):** No content.

**Response (404):**

```json
{
  "error": "Report not found"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3457/api/reports/550e8400-e29b-41d4-a716-446655440000
```

---

### Registry Statistics

```
GET /api/stats
```

Get aggregate statistics about the registry.

**Response (200):**

```json
{
  "total": 150,
  "byType": {
    "fake_citation": 65,
    "misquoted_statute": 30,
    "fabricated_contract_clause": 20,
    "hallucinated_precedent": 15,
    "other": 20
  },
  "bySeverity": {
    "critical": 10,
    "high": 45,
    "medium": 60,
    "low": 25,
    "info": 10
  }
}
```

---

### Schema Endpoint

```
GET /api/schema
```

Returns the HalluCase report schema definition, including available hallucination types and severity levels.

---

### Health Check

```
GET /health
```

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2025-06-15T10:00:00.000Z"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong",
  "issues": [
    {
      "path": "field.name",
      "message": "Detailed validation message"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Validation error |
| 404 | Report not found |
| 500 | Internal server error |
