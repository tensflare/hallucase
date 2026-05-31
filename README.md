# HalluCase — The Legal AI Hallucination Registry

<div align="center">
  <img src="./social-preview.png" alt="HalluCase Social Preview" width="100%" />
</div>

> **A living CVE-style registry for tracking, reproducing, and preventing hallucinations in legal AI outputs.**

[![CI](https://github.com/tensflare/hallucase/actions/workflows/ci.yml/badge.svg)](https://github.com/tensflare/hallucase/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/hallucase.svg)](https://www.npmjs.com/package/hallucase)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

---

## The Problem

In 2025, **729+ documented incidents** of AI hallucinations in legal contexts were reported. These incidents resulted in:

- **$31K+ in fines** for citing non-existent cases
- **ABA sanctions** against attorneys who submitted AI-hallucinated briefs
- **Breached contracts** containing fabricated clauses
- **Erroneous legal opinions** based on hallucinated precedents

HalluCase exists to systematically track these incidents so the legal profession can learn from them, build detection tooling, and pressure AI providers to fix the underlying issues.

---

## Quick Start

```bash
# Start the API server
npx hallucase serve

# Or clone and run from source
git clone https://github.com/tensflare/hallucase.git
cd hallucase
npm install
npm run serve
```

The API will be available at `http://localhost:3457`.

---

## CLI Usage

```bash
# Search the registry
hallucase search --query "fake citation" --severity critical

# Get a specific report
hallucase get HC-000001

# Submit a new report (interactive)
hallucase submit

# Submit from JSON
hallucase submit --file report.json

# View registry statistics
hallucase stats

# Import from external sources (CSV/JSON)
hallucase import data/charlotin-export.csv
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | Search/filter reports |
| `GET` | `/api/reports/:id` | Get report by UUID or HC-ID |
| `POST` | `/api/reports` | Create a new report |
| `PUT` | `/api/reports/:id` | Update a report |
| `DELETE` | `/api/reports/:id` | Delete a report |
| `GET` | `/api/stats` | Registry statistics |
| `GET` | `/api/schema` | Schema definition |
| `GET` | `/health` | Health check |

---

## Report Schema

Each report receives a unique identifier in the format:

**`HC-XXXXXX`** — where `XXXXXX` is a zero-padded sequential number.

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `hc_id` | `HC-XXXXXX` | Yes | Human-readable ID |
| `title` | string | Yes | Concise summary (5-200 chars) |
| `description` | string | Yes | Detailed description (min 20 chars) |
| `hallucination_type` | enum | Yes | Category of hallucination |
| `severity` | enum | Yes | Impact level |
| `domain` | string | Yes | Legal domain |
| `hallucinated_output` | string | Yes | What the AI produced |
| `expected_correct_output` | string | Yes | What should have been produced |

### Hallucination Types

- `fake_citation` — Non-existent case or document citations
- `misquoted_statute` — Incorrectly cited statutes or regulations
- `fabricated_contract_clause` — Made-up contract provisions
- `incorrect_legal_standard` — Wrong legal test or standard
- `fabricated_obligation` — Non-existent legal obligations
- `misstated_jurisdiction_law` — Incorrect statements about jurisdiction
- `incorrect_procedural_rule` — Wrong court procedures
- `hallucinated_precedent` — Fabricated case law precedents
- `other` — Other types of hallucinations

### Severity Levels

| Level | Meaning |
|-------|---------|
| `critical` | Would cause certain sanctions or adverse outcome |
| `high` | Likely to cause material harm |
| `medium` | Potentially misleading but less severe |
| `low` | Minor inaccuracies |
| `info` | Informational, no direct harm |

---

## How to Contribute

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

Built by [Tensflare](https://github.com/tensflare). Open infrastructure for trustworthy legal AI.
