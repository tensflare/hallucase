# HalluCase CLI Reference

## Usage

```bash
hallucase [command] [options]
```

## Global Options

| Option | Description |
|--------|-------------|
| `-V, --version` | Output the version number |
| `-h, --help` | Display help |

## Commands

---

### `search`

Search the hallucination registry.

```bash
hallucase search [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--query <query>` | `-q` | Full-text search query |
| `--type <type>` | `-t` | Filter by hallucination type |
| `--severity <severity>` | `-s` | Filter by severity level |
| `--domain <domain>` | `-d` | Filter by legal domain |
| `--jurisdiction <jurisdiction>` | `-j` | Filter by jurisdiction |
| `--model <model>` | `-m` | Filter by affected AI model |
| `--verified` | | Filter by verified status |
| `--page <page>` | | Page number (default: 1) |
| `--page-size <size>` | | Results per page (default: 20) |

**Examples:**

```bash
hallucase search --query "fake citation"
hallucase search --severity critical --type fake_citation
hallucase search --domain contracts --jurisdiction "US-CA" --page 2
hallucase search --model "GPT-4" --verified
```

**Output:** JSON search result with `total`, `page`, `page_size`, and `results` array.

---

### `get`

Retrieve a specific report by UUID or HC-ID.

```bash
hallucase get <id>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `id` | Report UUID or HC-ID (e.g., `HC-000001`) |

**Examples:**

```bash
hallucase get HC-000001
hallucase get 550e8400-e29b-41d4-a716-446655440000
```

**Output:** JSON representation of the report.

---

### `submit`

Submit a new hallucination report.

```bash
hallucase submit [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json <json>` | Submit report as JSON string |
| `--file <path>` | Submit report from JSON file |

**Without options** (interactive mode):

The CLI will prompt for each field:

1. **Title** — Brief summary of the hallucination
2. **Description** — Detailed description
3. **Hallucination type** — Select from numbered list
4. **Severity** — Select from numbered list
5. **Domain** — Legal practice area
6. **Jurisdiction** — Jurisdiction code (optional)
7. **Hallucinated output** — What the AI produced
8. **Expected correct output** — What should have been produced

**Example (interactive):**

```bash
hallucase submit
Title: Fabricated Case Citation in Legal Brief
Description: AI cited a non-existent Supreme Court case...
...
Report created: HC-000042 (550e8400-e29b-41d4-a716-446655440000)
```

**Example (JSON string):**

```bash
hallucase submit --json '{"title":"Test","description":"Test description...","hallucination_type":"fake_citation","domain":"litigation","hallucinated_output":"X","expected_correct_output":"Y"}'
```

**Example (JSON file):**

```bash
hallucase submit --file report.json
```

**Output:** JSON representation of the created report.

---

### `serve`

Start the HalluCase API server.

```bash
hallucase serve [options]
```

**Options:**

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--port <port>` | `-p` | `3457` | Port number |
| `--db <path>` | | `./hallucase.db` | Database file path |

**Examples:**

```bash
hallucase serve
hallucase serve --port 8080
hallucase serve --port 3000 --db /data/hallucase.db
```

**Output:** Server starts listening. Logs the URL to stdout.

---

### `stats`

Display registry statistics.

```bash
hallucase stats
```

**Output:**

```
HalluCase Registry Statistics
=============================
Total reports: 150

By type:
  fake_citation: 65
  misquoted_statute: 30
  fabricated_contract_clause: 20
  hallucinated_precedent: 15
  other: 20

By severity:
  medium: 60
  high: 45
  low: 25
  critical: 10
  info: 10
```

---

### `import`

Import reports from external sources (CSV or JSON).

```bash
hallucase import <file>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `file` | Path to CSV or JSON import file |

**Supported formats:**

- **Charlotin CSV** — The standard CSV export format from the Charlotin legal AI hallucination database
- **JSON** — An array of report objects or an object with a `reports` key

**Examples:**

```bash
hallucase import data/charlotin-export.csv
hallucase import data/reports.json
```

**Output:**

```
Import complete:
  Imported: 45
  Skipped: 3
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3457` | API server port |
| `DATABASE_PATH` | `./hallucase.db` | SQLite database file path |
