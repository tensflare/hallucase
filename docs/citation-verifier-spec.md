# HalluCase v0.2 — Citation Verification Engine

## Technical Specification

**Tensflare Ltd** · May 2026
**Target:** Ship citation verification CLI + API by June 3 (NY Part 161 deadline)

---

## 1. Architecture Overview

### 1.1 Layered Design

```
┌─────────────────────────────────────────────────────┐
│                   CLI (Commander)                     │
│  verify | file | eval | serve | search               │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 REST API (Express)                    │
│  /api/v1/verify | /api/v1/file | /api/v1/eval       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Verification Engine Core                 │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Citation     │  │ Source       │  │ Report    │  │
│  │ Parser       │  │ Resolver     │  │ Generator │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
│         │               │                  │        │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌──────▼──────┐ │
│  │ Proposition  │  │ Multi-Source  │  │ Compliance │ │
│  │ Extractor    │  │ Consensus     │  │ Reporter   │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Source Adapters Layer                    │
│                                                      │
│  ┌────────────┐  ┌────────┐  ┌───────────────┐      │
│  │ CourtListener│  │ CAP    │  │ Google Scholar │      │
│  │ REST API    │  │ API    │  │ Scraper       │      │
│  └────────────┘  └────────┘  └───────────────┘      │
│                                                      │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐     │
│  │ Free Law │  │ Local       │  │ User         │     │
│  │ Project  │  │ Corpus      │  │ Uploaded PDF │     │
│  └──────────┘  └────────────┘  └──────────────┘     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   Registry Store                      │
│  (existing: SqliteRegistryStore + MemoryRegistryStore)│
│  Extended: verifications table, reports table         │
└─────────────────────────────────────────────────────┘
```

### 1.2 Module Structure

All new code lives under `src/verify/` in the existing HalluCase project:

```
src/
├── cli.ts              # New commands added
├── index.ts            # New exports
├── schema.ts           # Extended schemas
├── api/
│   ├── server.ts       # Extended with verify routes
│   └── router.ts       # New verify/file/eval endpoints
├── registry/
│   ├── index.ts        # Extended store interface
│   ├── memory.ts       # Extended implementation
│   └── sqlite.ts       # Extended with verifications table
├── verify/             # NEW: verification engine
│   ├── index.ts        # Public API
│   ├── parser.ts       # Citation parsing and normalization
│   ├── resolver.ts     # Source lookup adapters
│   ├── extractor.ts    # Proposition extraction
│   ├── consensus.ts    # Multi-source agreement scoring
│   ├── reporter.ts     # Compliance report generation
│   └── sources/        # Source adapters
│       ├── types.ts    # Source adapter interface
│       ├── courtlistener.ts
│       ├── cap.ts
│       ├── google-scholar.ts
│       ├── free-law.ts
│       └── local-corpus.ts
└── validate/
    └── index.ts        # Extended with verify input validators
```

New dependencies:
- `node:https` / `node:http` (stdlib — already available)
- `cheerio` (for Google Scholar scraping — already a Duct dependency)
- `pdf-lib` or `jspdf` (for PDF compliance report generation)
- `ny-part-161` (custom compliance rule set — inline, no external dep)

---

## 2. Core Data Model

### 2.1 Citation Schema (extending MCP-Law's `CitationFormat`)

```typescript
// src/schema.ts — new types

export const CitationStatus = z.enum([
  'verified',          // Source exists and proposition matches
  'hallucinated',      // Source does not exist
  'misattributed',     // Source exists but does not support the proposition
  'unverifiable',       // Source cannot be accessed (paywall, offline, etc.)
  'pending',            // Verification in progress
])
export type CitationStatus = z.infer<typeof CitationStatus>

export const VerifiableCitation = z.object({
  raw_text: z.string(),              // Original citation text from document
  normalized_text: z.string(),       // Normalized form for lookups
  type: z.enum(['case', 'statute', 'regulation', 'treatise', 'other']),
  jurisdiction: z.string().optional(),
  components: z.record(z.string()).optional(),  // Parsed parts (volume, page, etc.)
})
export type VerifiableCitation = z.infer<typeof VerifiableCitation>

export const CitationVerification = z.object({
  id: z.string().uuid(),
  citation: VerifiableCitation,
  status: CitationStatus,
  confidence: z.number().min(0).max(1),  // 0.0 = sure hallucinated, 1.0 = sure verified
  sources_checked: z.array(z.object({
    source_name: z.string(),
    found: z.boolean(),
    proposition_match: z.boolean().optional(),
    url: z.string().url().optional(),
    error: z.string().optional(),
  })),
  matched_source_text: z.string().optional(),  // The text found at the source
  alternative_citations: z.array(z.string()).optional(),  // If the citation was close but wrong
  checked_at: z.string().datetime(),
})
export type CitationVerification = z.infer<typeof CitationVerification>

export const DocumentVerification = z.object({
  id: z.string().uuid(),
  document_name: z.string(),
  document_hash: z.string(),         // SHA-256 of source text
  total_citations: z.number(),
  verified_count: z.number(),
  hallucinated_count: z.number(),
  misattributed_count: z.number(),
  unverifiable_count: z.number(),
  pending_count: z.number(),
  overall_score: z.number().min(0).max(1),  // Aggregate trust score
  citations: z.array(CitationVerification),
  checked_at: z.string().datetime(),
  duration_ms: z.number(),
})
export type DocumentVerification = z.infer<typeof DocumentVerification>

export const ComplianceStandard = z.enum([
  'ny-part-161',
  'fl-rule-2025',
  'ca-sb-574',
  'generic',
])
export type ComplianceStandard = z.infer<typeof ComplianceStandard>

export const ComplianceReport = z.object({
  id: z.string().uuid(),
  document_verification_id: z.string().uuid(),
  standard: ComplianceStandard,
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  findings: z.array(z.object({
    citation: VerifiableCitation,
    status: CitationStatus,
    requirement: z.string(),
    met: z.boolean(),
    detail: z.string(),
  })),
  summary: z.string(),
  generated_at: z.string().datetime(),
  expires_at: z.string().datetime(),  // Compliance reports are time-bound
})
export type ComplianceReport = z.infer<typeof ComplianceReport>
```

### 2.2 Store Extensions

```typescript
// Registry store interface additions

export interface VerificationStore {
  saveVerification(v: CitationVerification): Promise<void>
  getVerification(id: string): Promise<CitationVerification | null>
  searchVerifications(filters: {
    status?: CitationStatus
    jurisdiction?: string
    date_from?: string
    date_to?: string
  }): Promise<{ total: number; results: CitationVerification[] }>

  saveDocumentVerification(dv: DocumentVerification): Promise<void>
  getDocumentVerification(id: string): Promise<DocumentVerification | null>

  saveComplianceReport(cr: ComplianceReport): Promise<void>
  getComplianceReport(id: string): Promise<ComplianceReport | null>
}
```

### 2.3 SQLite Schema Additions

```sql
CREATE TABLE IF NOT EXISTS citation_verifications (
  id TEXT PRIMARY KEY,
  document_verification_id TEXT,
  raw_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  type TEXT NOT NULL,
  jurisdiction TEXT,
  components TEXT,
  status TEXT NOT NULL,
  confidence REAL NOT NULL,
  sources_checked TEXT NOT NULL,   -- JSON array
  matched_source_text TEXT,
  alternative_citations TEXT,      -- JSON array or null
  checked_at TEXT NOT NULL,
  FOREIGN KEY (document_verification_id) REFERENCES document_verifications(id)
);

CREATE TABLE IF NOT EXISTS document_verifications (
  id TEXT PRIMARY KEY,
  document_name TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  total_citations INTEGER NOT NULL,
  verified_count INTEGER NOT NULL DEFAULT 0,
  hallucinated_count INTEGER NOT NULL DEFAULT 0,
  misattributed_count INTEGER NOT NULL DEFAULT 0,
  unverifiable_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  overall_score REAL NOT NULL,
  duration_ms INTEGER NOT NULL,
  checked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id TEXT PRIMARY KEY,
  document_verification_id TEXT NOT NULL,
  standard TEXT NOT NULL,
  passed INTEGER NOT NULL,
  score REAL NOT NULL,
  findings TEXT NOT NULL,        -- JSON array
  summary TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (document_verification_id) REFERENCES document_verifications(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_status ON citation_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verification_jurisdiction ON citation_verifications(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_doc_verification_hash ON document_verifications(document_hash);
CREATE INDEX IF NOT EXISTS idx_compliance_standard ON compliance_reports(standard);
```

---

## 3. Citation Parser (`src/verify/parser.ts`)

### 3.1 Pipeline

```
Input text → Normalize → Classify → Parse components → Output VerifiableCitation
```

### 3.2 Citation Patterns (beyond MCP-Law's existing 4 formats)

MCP-Law already handles: US Reports, Federal Reporter, UK Neutral, ECLI.

HalluCase v0.2 adds parser patterns for:

| Jurisdiction | Pattern | Example |
|---|---|---|
| US (all) | `\d+ F\.\d?[d] \d+` | 987 F.3d 123 |
| US | `\d+ F\.\s?Supp\. \d+` | 456 F. Supp. 3d 789 |
| US | `\d+ U\.S\. \d+` | 410 U.S. 113 |
| US | `\d+ S\.Ct\. \d+` | 567 S. Ct. 890 |
| US Statutes | `\d+ U\.S\.C\. § \d+` | 15 U.S.C. § 1 |
| US FR | `Fed\. R\. Civ\. P\. \d+` | Fed. R. Civ. P. 12(b)(6) |
| US Public Laws | `Pub\. L\. No\. \d+–\d+` | Pub. L. No. 117-328 |
| UK | `\[\d{4}\] UK(SC|HL|PC) \d+` | [2024] UKSC 1 |
| UK | `\[\d{4}\] EWCA (Civ|Crim) \d+` | [2023] EWCA Civ 1234 |
| UK | `\[\d{4}\] EWHC \d+ \((KB|Ch|QB|Admin|Fam)\)` | [2024] EWHC 567 (KB) |
| UK Statutes | `[A-Z][a-z]+ Act \d{4}` | Senior Courts Act 1981 |
| AU | `\(\d{4}\) \d+ ALJR \d+` | (2024) 98 ALJR 123 |
| AU | `\(\d{4}\) \d+ CLR \d+` | (2023) 97 CLR 456 |
| AU | `\[\d{4}\] FCAFC \d+` | [2024] FCAFC 78 |
| CA | `\[\d{4}\] \d+ S\.C\.R\. \d+` | [2004] 3 S.C.R. 123 |
| CA | `\d+ D\.L\.R\. \(\d+[a-z]+\) \d+` | 45 D.L.R. (4th) 678 |
| EU | `Case C-\d+/\d+` | Case C-468/93 |
| Generic | `\d+ [A-Za-z\.,]+ v\. [A-Za-z\.,]+` | Smith v. Jones |
| Generic | `\[\d{4}\] [A-Z]+\d+` | [2024] NSWCA 42 |

### 3.3 Normalization Rules

```typescript
// src/verify/parser.ts

function normalizeCitation(raw: string): string {
  let s = raw.trim()
  // Strip trailing punctuation (periods, commas, semicolons)
  s = s.replace(/[.,;:]+$/, '')
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ')
  // Normalize reporter abbreviations
  s = s.replace(/\bF\. Supp\.\b/g, 'F. Supp.')
  s = s.replace(/\bF\.[23]d\b/g, m => m)
  // Strip bolding/italics markers
  s = s.replace(/[\*_#]+/g, '')
  return s
}
```

### 3.4 Extraction from Free Text

The parser must extract citations from arbitrary text. Strategy:

1. **Regex pass** — Match against known citation patterns. Return all matches with positions.
2. **Context extraction** — For each matched citation, extract ±200 characters of surrounding text as the alleged proposition.
3. **Named Entity fallback** — For citations that don't match regex patterns, use simple heuristics:
   - "X v. Y" → treat as case citation candidate
   - "Section \d+" → treat as statute reference candidate
4. **Deduplication** — Same citation appearing multiple times = one verification.

```typescript
function extractCitations(text: string): Array<{
  citation: VerifiableCitation
  context: string         // Surrounding text
  charStart: number
  charEnd: number
}> {
  const results: Array<{...}> = []
  // Sort all patterns by length (longest first to avoid partial matches)
  const sortedPatterns = [...ALL_PATTERNS].sort((a, b) => b.regex.source.length - a.regex.source.length)
  const usedRanges: Array<[number, number]> = []

  for (const pattern of sortedPatterns) {
    const regex = new RegExp(pattern.regex.source, 'gi')
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      // Skip if overlapping with already-extracted citation
      if (usedRanges.some(([start, end]) => match!.index < end && match!.index + match![0].length > start)) {
        continue
      }
      const start = match.index
      const end = start + match[0].length
      usedRanges.push([start, end])

      const contextStart = Math.max(0, start - 200)
      const contextEnd = Math.min(text.length, end + 200)

      results.push({
        citation: {
          raw_text: match[0],
          normalized_text: normalizeCitation(match[0]),
          type: pattern.type,
          jurisdiction: pattern.jurisdiction,
          components: extractComponents(pattern, match),
        },
        context: text.slice(contextStart, contextEnd),
        charStart: start,
        charEnd: end,
      })
    }
  }

  return results
}
```

---

## 4. Source Resolver Layer (`src/verify/resolver.ts` + `src/verify/sources/`)

### 4.1 Source Adapter Interface

```typescript
export interface SourceAdapter {
  readonly name: string
  readonly priority: number          // Lower = checked first
  readonly rateLimit: number         // ms between requests

  resolve(citation: VerifiableCitation): Promise<SourceResult>

  // Check if this adapter can handle this jurisdiction/type
  supports(citation: VerifiableCitation): boolean
}

export interface SourceResult {
  found: boolean
  propositionMatch?: boolean         // Does the source say what the citation claims?
  matchedText?: string               // The text found at the source
  url?: string
  jurisdiction?: string
  error?: string
  responseTimeMs: number
}
```

### 4.2 Adapter: CourtListener (`src/verify/sources/courtlistener.ts`)

```typescript
export class CourtListenerAdapter implements SourceAdapter {
  readonly name = 'CourtListener'
  readonly priority = 1
  readonly rateLimit = 500  // 2 req/s on free plan

  private baseUrl = 'https://www.courtlistener.com/api/rest/v3'
  private apiKey: string

  constructor() {
    this.apiKey = process.env['COURTLISTENER_API_KEY'] ?? ''
  }

  supports(citation: VerifiableCitation): boolean {
    return citation.type === 'case' && (
      citation.jurisdiction === 'US' ||
      citation.jurisdiction === undefined
    )
  }

  async resolve(citation: VerifiableCitation): Promise<SourceResult> {
    const start = Date.now()

    try {
      // Step 1: Search for the citation
      // CourtListener supports searching by citation string
      const searchUrl = `${this.baseUrl}/opinions/?citation=${encodeURIComponent(citation.normalized_text)}&format=json`
      const response = await fetch(searchUrl, {
        headers: this.apiKey ? { 'Authorization': `Token ${this.apiKey}` } : {},
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return { found: false, error: `CourtListener: HTTP ${response.status}`, responseTimeMs: Date.now() - start }
      }

      const data = await response.json() as { count: number; results: Array<{ id: number; case_name: string; citation: string; plain_text?: string }> }

      if (data.count === 0) {
        return { found: false, responseTimeMs: Date.now() - start }
      }

      const opinion = data.results[0]

      return {
        found: true,
        url: `https://www.courtlistener.com/opinion/${opinion.id}/`,
        matchedText: opinion.plain_text?.slice(0, 5000),
        responseTimeMs: Date.now() - start,
      }
    } catch (err) {
      return {
        found: false,
        error: `CourtListener: ${err instanceof Error ? err.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - start,
      }
    }
  }
}
```

### 4.3 Adapter: Caselaw Access Project (CAP) (`src/verify/sources/cap.ts`)

```typescript
export class CAPAdapter implements SourceAdapter {
  readonly name = 'Caselaw Access Project (Harvard)'
  readonly priority = 2
  readonly rateLimit = 200

  supports(citation: VerifiableCitation): boolean {
    return citation.type === 'case' && (
      citation.jurisdiction === 'US' ||
      citation.jurisdiction?.startsWith('US-')
    )
  }

  async resolve(citation: VerifiableCitation): Promise<SourceResult> {
    const start = Date.now()

    try {
      // CAP API: https://api.case.law/v1/cases/?cite=<citation>
      const url = `https://api.case.law/v1/cases/?cite=${encodeURIComponent(citation.normalized_text)}&page_size=1&format=json`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return { found: false, error: `CAP: HTTP ${response.status}`, responseTimeMs: Date.now() - start }
      }

      const data = await response.json() as { count: number; results: Array<{ name: string; name_abbreviation: string; citations: Array<{ cite: string }>; url: string }> }

      if (data.count === 0) {
        return { found: false, responseTimeMs: Date.now() - start }
      }

      const result = data.results[0]
      return {
        found: true,
        url: result.url,
        jurisdiction: result.citations[0]?.cite?.match(/([A-Z]{2,3})\b/)?.[1],
        responseTimeMs: Date.now() - start,
      }
    } catch (err) {
      return {
        found: false,
        error: `CAP: ${err instanceof Error ? err.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - start,
      }
    }
  }
}
```

### 4.4 Adapter: Google Scholar (`src/verify/sources/google-scholar.ts`)

```typescript
export class GoogleScholarAdapter implements SourceAdapter {
  readonly name = 'Google Scholar'
  readonly priority = 3
  readonly rateLimit = 2000  // Be respectful

  supports(citation: VerifiableCitation): boolean {
    return citation.type === 'case'
  }

  async resolve(citation: VerifiableCitation): Promise<SourceResult> {
    const start = Date.now()

    try {
      // Note: Google Scholar has no official API.
      // We scrape the "Search for" or "Cited by" case search.
      // This is fragile and should be used as fallback only.
      const query = encodeURIComponent(citation.normalized_text)
      const url = `https://scholar.google.com/scholar?q=${query}&as_sdt=4,33&as_ylo=1750`

      // Cache-friendly request (Scholar blocks aggressively)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HalluCase/0.2; +https://github.com/tensflare/hallucase)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        return { found: false, error: `Google Scholar: HTTP ${response.status}`, responseTimeMs: Date.now() - start }
      }

      const html = await response.text()

      // Check if results exist (Scholar returns results page even for zero results)
      const hasResults = html.includes('class="gs_ri"') || html.includes('id="gs_res_ccl"')
      const resultCount = html.match(/About (\d+) results/) || html.match(/\[\d+\]/)

      return {
        found: hasResults && resultCount !== null,
        url,
        responseTimeMs: Date.now() - start,
      }
    } catch (err) {
      return {
        found: false,
        error: `Google Scholar: ${err instanceof Error ? err.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - start,
      }
    }
  }
}
```

### 4.5 Adapter: Free Law Project (`src/verify/sources/free-law.ts`)

```typescript
export class FreeLawAdapter implements SourceAdapter {
  readonly name = 'Free Law Project'
  readonly priority = 4
  readonly rateLimit = 500

  supports(citation: VerifiableCitation): boolean {
    return citation.type === 'case' && citation.jurisdiction === 'US'
  }

  async resolve(citation: VerifiableCitation): Promise<SourceResult> {
    // Reuses the same API as CourtListener (Free Law Project runs both)
    // But has different rate limits and a separate API key
    // Implementation mirrors CourtListener but with different auth
    // ... (same pattern as CourtListenerAdapter)
  }
}
```

### 4.6 Adapter: Local Corpus (`src/verify/sources/local-corpus.ts`)

For firms with their own document repositories, Duct integration:

```typescript
export class LocalCorpusAdapter implements SourceAdapter {
  readonly name = 'Local Corpus'
  readonly priority = 0   // Check local first
  readonly rateLimit = 0

  private duct: Duct | null = null
  private corpusPath: string

  constructor(corpusPath?: string) {
    this.corpusPath = corpusPath ?? process.env['HALLUCASE_CORPUS_PATH'] ?? ''
  }

  supports(citation: VerifiableCitation): boolean {
    return this.corpusPath !== '' && citation.type === 'case'
  }

  async resolve(citation: VerifiableCitation): Promise<SourceResult> {
    const start = Date.now()

    try {
      if (!this.duct) {
        const { Duct } = await import('@docfide/duct')
        this.duct = new Duct({
          persistPath: this.corpusPath,
          chunk: { strategy: 'by-heading', size: 2000 },
          embed: undefined,  // Keyword search only for speed
        })
        await this.duct.index(this.corpusPath)
      }

      const results = await this.duct.search(citation.normalized_text, 5)

      const match = results.find(r =>
        r.chunk.content.toLowerCase().includes(citation.normalized_text.toLowerCase())
      )

      return {
        found: !!match,
        matchedText: match?.chunk.content,
        responseTimeMs: Date.now() - start,
      }
    } catch (err) {
      return {
        found: false,
        error: `Local Corpus: ${err instanceof Error ? err.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - start,
      }
    }
  }
}
```

### 4.7 Source Resolution Orchestrator

```typescript
// src/verify/resolver.ts

export class SourceResolver {
  private adapters: SourceAdapter[]

  constructor(adapters?: SourceAdapter[]) {
    this.adapters = adapters ?? [
      new LocalCorpusAdapter(),
      new CourtListenerAdapter(),
      new CAPAdapter(),
      new FreeLawAdapter(),
      new GoogleScholarAdapter(),
    ]
  }

  async resolve(citation: VerifiableCitation): Promise<CitationVerification> {
    const applicable = this.adapters
      .filter(a => a.supports(citation))
      .sort((a, b) => a.priority - b.priority)

    const sourcesChecked: Array<{...}> = []
    let found = false
    let matchedText: string | undefined
    let matchedUrl: string | undefined

    for (const adapter of applicable) {
      await delay(adapter.rateLimit)  // Respect rate limits between adapters

      const result = await adapter.resolve(citation)
      sourcesChecked.push({
        source_name: adapter.name,
        found: result.found,
        url: result.url,
        error: result.error,
      })

      if (result.found && !found) {
        found = true
        matchedText = result.matchedText
        matchedUrl = result.url
      }
    }

    const citationStatus: CitationStatus = found ? 'verified' : 'hallucinated'
    const confidence = found
      ? calculateConfidence(sourcesChecked, citation)
      : 0.0

    return {
      id: uuidv4(),
      citation,
      status: citationStatus,
      confidence,
      sources_checked: sourcesChecked,
      matched_source_text: matchedText,
      checked_at: new Date().toISOString(),
    }
  }
}
```

---

## 5. Proposition Extractor (`src/verify/extractor.ts`)

### 5.1 The Hard Problem

The proposition extractor attempts to answer: *Does the cited source actually say what the AI claims it says?* This is the "misattributed" vs. "verified" distinction.

**Strategy (phase 1 — simple):**
1. Extract ±200 character context around each citation in the source document.
2. Check if the matched source text exists.
3. For "misattributed" detection: compare the quoting text with the source text using TF-IDF overlap. If they share <10% significant words, flag as misattributed.

**Strategy (phase 2 — LLM-assisted):**
1. Send the proposition context + the sourced text to a small, fast LLM (e.g., Claude Haiku, GPT-4o-mini).
2. Ask: "Does this source text support the proposition attributed to it in this document?" Yes/No/Unclear.
3. Use the LLM judgment as an additional confidence signal.

**Phase 1 implementation:**

```typescript
export class PropositionExtractor {
  async evaluate(
    propositionContext: string,
    sourceText: string | undefined,
  ): Promise<{ matches: boolean; confidence: number; detail: string }> {
    if (!sourceText) {
      return { matches: false, confidence: 0, detail: 'No source text available for comparison' }
    }

    // Simple overlap check
    const srcTokens = new Set(tokenize(sourceText))
    const propTokens = new Set(tokenize(propositionContext))
    const overlap = [...propTokens].filter(t => srcTokens.has(t))

    const overlapRatio = propTokens.size > 0 ? overlap.length / propTokens.size : 0

    // Remove common legal stopwords from the overlap for more useful signal
    const significantOverlap = overlap.filter(t => !LEGAL_STOPWORDS.has(t))
    const significantPropTokens = [...propTokens].filter(t => !LEGAL_STOPWORDS.has(t))
    const significantRatio = significantPropTokens.length > 0
      ? significantOverlap.length / significantPropTokens.length
      : 0

    if (significantRatio > 0.5) {
      return { matches: true, confidence: significantRatio, detail: `Source text shares ${Math.round(significantRatio * 100)}% of significant terms with proposition` }
    } else if (significantRatio > 0.1) {
      return { matches: false, confidence: significantRatio, detail: `Weak lexical overlap (${Math.round(significantRatio * 100)}%). May be misattributed.` }
    } else {
      return { matches: false, confidence: significantRatio, detail: `Source text does not contain the attributed proposition (${Math.round(significantRatio * 100)}% overlap).` }
    }
  }
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2)
}

const LEGAL_STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'shall',
  'court', 'case', 'law', 'section', 'state', 'v', 'vs', 'inc',
  'ltd', 'co', 'held', 'find', 'hold', 'rule', 'order',
])
```

---

## 6. Consensus Engine (`src/verify/consensus.ts`)

### 6.1 Confidence Scoring

```typescript
function calculateConfidence(
  sources: Array<{ found: boolean; error?: string }>,
  citation: VerifiableCitation,
): number {
  const total = sources.length
  const found = sources.filter(s => s.found).length
  const errored = sources.filter(s => s.error).length

  if (total === 0) return 0

  let score = found / total

  // Penalize if all sources errored (network issue, not truly hallucinated)
  if (errored === total) {
    score = 0.3  // "unverifiable, not necessarily hallucinated"
  }

  // Boost if multiple independent sources agree
  if (found >= 2 && total >= 3) {
    score = Math.min(1.0, score + 0.15)
  }

  // Penalize non-US jurisdictions (fewer free sources)
  if (citation.jurisdiction && !citation.jurisdiction.startsWith('US') && total < 3) {
    score = Math.max(0, score - 0.15)
  }

  return Math.round(score * 100) / 100
}
```

---

## 7. Document Verification Pipeline (`src/verify/index.ts`)

```typescript
export class CitationVerifier {
  private parser: CitationParser
  private resolver: SourceResolver
  private extractor: PropositionExtractor

  constructor(options?: { corpusPath?: string }) {
    this.parser = new CitationParser()
    const adapters = [
      ...(options?.corpusPath ? [new LocalCorpusAdapter(options.corpusPath)] : []),
      new CourtListenerAdapter(),
      new CAPAdapter(),
      new FreeLawAdapter(),
      new GoogleScholarAdapter(),
    ]
    this.resolver = new SourceResolver(adapters)
    this.extractor = new PropositionExtractor()
  }

  async verifyText(text: string): Promise<DocumentVerification> {
    const start = Date.now()
    const docHash = createHash('sha256').update(text).digest('hex')

    // Step 1: Extract all citations
    const extracted = this.parser.extractCitations(text)

    // Step 2: Deduplicate by normalized text
    const seen = new Set<string>()
    const uniqueCitations = extracted.filter(e => {
      const key = e.citation.normalized_text.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Step 3: Resolve each citation
    const verifications = await Promise.all(
      uniqueCitations.map(async (e) => {
        const result = await this.resolver.resolve(e.citation)

        // Step 4: If found, check proposition match
        if (result.status === 'verified') {
          const proposition = await this.extractor.evaluate(
            e.context,
            result.matched_source_text,
          )
          if (!proposition.matches) {
            result.status = 'misattributed'
            result.confidence = Math.min(result.confidence, proposition.confidence)
          }
        }

        return result
      })
    )

    // Step 5: Aggregate
    const stats = {
      verified: 0, hallucinated: 0, misattributed: 0,
      unverifiable: 0, pending: 0,
    }
    for (const v of verifications) {
      stats[v.status === 'unverifiable' ? 'unverifiable' : v.status as keyof typeof stats]++
    }

    const overallScore = verifications.length > 0
      ? verifications.reduce((sum, v) => sum + v.confidence, 0) / verifications.length
      : 0

    const docVerification: DocumentVerification = {
      id: uuidv4(),
      document_name: 'inline',
      document_hash: docHash,
      total_citations: verifications.length,
      ...stats,
      overall_score: Math.round(overallScore * 100) / 100,
      citations: verifications,
      checked_at: new Date().toISOString(),
      duration_ms: Date.now() - start,
    }

    return docVerification
  }
}
```

---

## 8. Compliance Reporter (`src/verify/reporter.ts`)

### 8.1 NY Part 161 Rule

NY Part 161 (effective June 1, 2026) requires:
- Attorneys must disclose use of generative AI in court filings
- All AI-generated citations must be independently verified
- Failure to comply = sanctions, referral to disciplinary committee

### 8.2 Compliance Check Logic

```typescript
const COMPLIANCE_RULES: Record<string, Array<{
  id: string
  description: string
  check: (doc: DocumentVerification) => { met: boolean; detail: string }
}>> = {
  'ny-part-161': [
    {
      id: 'ny-161-1',
      description: 'All citations must be verified',
      check: (doc) => ({
        met: doc.hallucinated_count === 0 && doc.misattributed_count === 0,
        detail: `${doc.verified_count}/${doc.total_citations} citations verified`,
      }),
    },
    {
      id: 'ny-161-2',
      description: 'Verification must be documented',
      check: (doc) => ({
        met: doc.checked_at !== undefined,
        detail: `Verified at ${doc.checked_at}`,
      }),
    },
  ],
  // Future rules: 'fl-rule-2025', 'ca-sb-574'
}
```

### 8.3 PDF Report Generation

```typescript
export async function generateComplianceReport(
  docVerification: DocumentVerification,
  standard: ComplianceStandard = 'ny-part-161',
): Promise<ComplianceReport> {
  const passed = docVerification.hallucinated_count === 0 && docVerification.misattributed_count === 0
  const rules = COMPLIANCE_RULES[standard] ?? COMPLIANCE_RULES['generic']

  const findings = rules.map(rule => {
    const result = rule.check(docVerification)
    return {
      citation: docVerification.citations[0]?.citation ?? { raw_text: '', normalized_text: '', type: 'other' },
      status: docVerification.citations[0]?.status ?? 'pending',
      requirement: rule.description,
      met: result.met,
      detail: result.detail,
    }
  })

  return {
    id: uuidv4(),
    document_verification_id: docVerification.id,
    standard,
    passed,
    score: docVerification.overall_score,
    findings,
    summary: passed
      ? `ALL CITATIONS VERIFIED — compliant with ${standard}`
      : `${docVerification.hallucinated_count + docVerification.misattributed_count} CITATION ISSUES — not compliant with ${standard}`,
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h validity
  }
}
```

---

## 9. CLI Commands

### 9.1 `hallucase verify`

```typescript
// Added to src/cli.ts

program
  .command('verify')
  .description('Verify a single citation string')
  .argument('<citation>', 'Citation text to verify (e.g. "410 U.S. 113")')
  .option('-j, --jurisdiction <code>', 'Jurisdiction hint (e.g., US, UK, AU)')
  .option('--json', 'Output as JSON')
  .option('--no-color', 'Disable colored output')
  .action(async (citation: string, options) => {
    const verifier = new CitationVerifier()
    const result = await verifier.verifyText(citation)

    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
      return
    }

    if (result.citations.length === 0) {
      console.log(chalk.yellow('\n  Could not parse citation from input.'))
      console.log(chalk.dim('  Supported formats: US Reports, Federal Reporter, UK Neutral, ECLI'))
      process.exit(1)
    }

    const c = result.citations[0]
    const icon = c.status === 'verified' ? chalk.green('✓') : chalk.red('✗')
    const color = c.status === 'verified' ? chalk.green : chalk.red

    console.log(`\n  ${icon} ${color.bold(c.status.toUpperCase())} (${(c.confidence * 100).toFixed(0)}% confidence)\n`)

    console.log(`  ${chalk.dim('Citation:')} ${c.citation.raw_text}`)
    console.log(`  ${chalk.dim('Type:')} ${c.citation.type}`)
    if (c.citation.jurisdiction) console.log(`  ${chalk.dim('Jurisdiction:')} ${c.citation.jurisdiction}`)
    console.log()

    console.log(`  ${chalk.dim('Sources checked:')}`)
    for (const s of c.sources_checked) {
      const found = s.found ? chalk.green('✓') : chalk.dim('—')
      console.log(`    ${found} ${s.source_name}${s.error ? chalk.dim(` (${s.error})`) : ''}`)
    }
    console.log()

    process.exit(c.status === 'verified' ? 0 : 1)
  })
```

**Usage:**
```bash
# Verify a citation
hallucase verify "410 U.S. 113"
# → ✓ VERIFIED (100% confidence)

# Verify a hallucinated citation
hallucase verify "Varghese v. China Southern Airlines, 987 F. Supp. 3d 456 (S.D.N.Y. 2023)"
# → ✗ HALLUCINATED (0% confidence)

# JSON output
hallucase verify "410 U.S. 113" --json

# With jurisdiction hint
hallucase verify "[2024] UKSC 1" --jurisdiction UK
```

### 9.2 `hallucase file`

```typescript
program
  .command('file')
  .description('Verify all citations in a document')
  .argument('<path>', 'Path to document (MD, TXT, PDF, DOCX)')
  .option('--extract', 'Extract citations using Duct (requires @docfide/duct)')
  .option('-j, --jurisdiction <code>', 'Default jurisdiction hint')
  .option('--exit-code', 'Exit 1 if any hallucination found (for CI/CD)')
  .option('--json', 'Output as JSON')
  .option('--corpus <path>', 'Local corpus directory for verification')
  .action(async (filePath: string, options) => {
    const text = await extractText(filePath)  // Reads file, handles PDF/DOCX via Duct or basic extraction

    const verifier = new CitationVerifier({ corpusPath: options.corpus })
    const result = await verifier.verifyText(text)

    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
      process.exit(options.exitCode && result.hallucinated_count > 0 ? 1 : 0)
      return
    }

    printVerificationSummary(result)

    process.exit(options.exitCode && (result.hallucinated_count > 0 || result.misattributed_count > 0) ? 1 : 0)
  })
```

**Usage:**
```bash
# Verify a brief before filing
hallucase file brief.md
# → ✓ Verified: 24/24 citations found
# → ✓ All propositions match source text

# CI/CD gate
hallucase file brief.md --exit-code
# → Exit 0 if all good, exit 1 if any hallucination

# With local corpus
hallucase file brief.md --corpus ./my-precedents/
```

### 9.3 `hallucase eval`

```typescript
program
  .command('eval')
  .description('Evaluate document against a compliance standard')
  .argument('<path>', 'Path to document')
  .option('-s, --standard <standard>', 'Compliance standard', 'ny-part-161')
  .option('--pdf', 'Generate PDF compliance report')
  .option('--json', 'Output as JSON')
  .option('--corpus <path>', 'Local corpus directory')
  .action(async (filePath: string, options) => {
    const text = await extractText(filePath)
    const verifier = new CitationVerifier({ corpusPath: options.corpus })
    const docVerification = await verifier.verifyText(text)
    const compliance = await generateComplianceReport(docVerification, options.standard as ComplianceStandard)

    if (options.pdf) {
      const pdfPath = await generatePDFReport(compliance, docVerification)
      console.log(`\n  ✓ Compliance report saved to: ${pdfPath}`)
      return
    }

    if (options.json) {
      console.log(JSON.stringify(compliance, null, 2))
      return
    }

    // Terminal output
    const passIcon = compliance.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL')
    console.log(`\n  ${passIcon} ${options.standard.toUpperCase()} Compliance Check\n`)
    console.log(`  Score: ${Math.round(compliance.score * 100)}%`)
    console.log(`  Expires: ${new Date(compliance.expires_at).toLocaleString()}\n`)

    for (const f of compliance.findings) {
      const met = f.met ? chalk.green('✓') : chalk.red('✗')
      console.log(`  ${met} ${f.requirement}`)
      console.log(`    ${chalk.dim(f.detail)}`)
      console.log()
    }
  })
```

**Usage:**
```bash
# Evaluate for NY Part 161 compliance
hallucase eval brief.md --standard ny-part-161
# → ✗ FAIL NY-PART-161 Compliance Check
# → Score: 88%
# → ✗ All citations must be verified: 22/24 citations verified

# Generate PDF compliance report
hallucase eval brief.md --standard ny-part-161 --pdf
# → ✓ Compliance report saved to: ./compliance-reports/brief-ny-part-161-2026-06-01.pdf
```

### 9.4 `hallucase serve` (extended)

The existing `serve` command gains new endpoints (see Section 10).

---

## 10. REST API Endpoints

### 10.1 New Endpoints

```typescript
// Added to src/api/router.ts

// POST /api/v1/verify — Verify a single citation
router.post('/api/v1/verify', async (req, res) => {
  const { citation, jurisdiction } = req.body
  const verifier = new CitationVerifier()
  const result = await verifier.verifyText(citation)
  res.json(result.citations[0] ?? { error: 'Could not parse citation' })
})

// POST /api/v1/file — Verify a document
router.post('/api/v1/file', async (req, res) => {
  const { text, jurisdiction, corpus_path } = req.body
  const verifier = new CitationVerifier({ corpusPath: corpus_path })
  const result = await verifier.verifyText(text)
  res.json(result)
})

// POST /api/v1/file/upload — Upload a file for verification
router.post('/api/v1/file/upload', upload.single('file'), async (req, res) => {
  // Save to temp, extract text, verify, return result
})

// POST /api/v1/eval — Compliance evaluation
router.post('/api/v1/eval', async (req, res) => {
  const { text, standard } = req.body
  const verifier = new CitationVerifier()
  const docVerification = await verifier.verifyText(text)
  const compliance = await generateComplianceReport(docVerification, standard)
  res.json(compliance)
})

// GET /api/v1/reports/:id — Get a previous verification report
router.get('/api/v1/reports/:id', async (req, res) => {
  const report = await store.getDocumentVerification(req.params.id)
  if (!report) return res.status(404).json({ error: 'Report not found' })
  res.json(report)
})

// GET /api/v1/compliance/:id — Get a previous compliance report
router.get('/api/v1/compliance/:id', async (req, res) => {
  const report = await store.getComplianceReport(req.params.id)
  if (!report) return res.status(404).json({ error: 'Report not found' })
  res.json(report)
})
```

### 10.2 Full API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/verify` | Verify a single citation string |
| `POST` | `/api/v1/file` | Verify all citations in text |
| `POST` | `/api/v1/file/upload` | Upload file (PDF/DOCX/MD/TXT) for verification |
| `POST` | `/api/v1/eval` | Full compliance evaluation |
| `GET` | `/api/v1/reports/:id` | Retrieve previous document verification |
| `GET` | `/api/v1/compliance/:id` | Retrieve previous compliance report |
| `GET` | `/api/v1/sources` | List configured source adapters |
| `GET` | `/api/v1/standards` | List supported compliance standards |
| `GET` | `/api/v1/stats` | Verification statistics (total verifications, hallucination rate, etc.) |

### 10.3 Example API Session

```bash
# Verify a single citation
curl -X POST http://localhost:3457/api/v1/verify \
  -H 'Content-Type: application/json' \
  -d '{"citation": "410 U.S. 113"}'

→ {
  "id": "...",
  "citation": { "raw_text": "410 U.S. 113", ... },
  "status": "verified",
  "confidence": 1.0,
  "sources_checked": [
    { "source_name": "CourtListener", "found": true },
    { "source_name": "Caselaw Access Project (Harvard)", "found": true }
  ]
}

# Verify a document for compliance
curl -X POST http://localhost:3457/api/v1/eval \
  -H 'Content-Type: application/json' \
  -d '{"text": "...", "standard": "ny-part-161"}'

→ {
  "standard": "ny-part-161",
  "passed": false,
  "score": 0.88,
  "findings": [...]
}
```

---

## 11. MCP-Law Integration

### 11.1 MCP Tool: `hallucase_verify`

```typescript
// New file: src/mcp/verify-tool.ts

import { createLegalMCPServer, type ToolDefinition } from '@tensflare/mcp-law'

const verifyTool: ToolDefinition = {
  name: 'hallucase_verify',
  description: 'Verify legal citations — check if a cited source actually exists and supports the claimed proposition',
  inputSchema: {
    type: 'object',
    properties: {
      citation: { type: 'string', description: 'Citation text to verify' },
      context: { type: 'string', description: 'Surrounding text (for proposition matching)' },
      jurisdiction: { type: 'string', description: 'Jurisdiction hint (e.g., US, UK, AU)' },
    },
    required: ['citation'],
  },
  handler: async (args) => {
    const verifier = new CitationVerifier()
    const citation = args.citation as string
    const context = args.context as string | undefined
    const jurisdiction = args.jurisdiction as string | undefined

    const text = context ? `${context}\n\n${citation}` : citation
    const result = await verifier.verifyText(text)

    const v = result.citations[0] || { status: 'unverifiable', confidence: 0 }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          citation,
          status: v.status,
          confidence: v.confidence,
          sources_checked: v.sources_checked?.map(s => s.source_name) ?? [],
          total_sources: v.sources_checked?.length ?? 0,
          verified_by: v.sources_checked?.filter(s => s.found).length ?? 0,
        }, null, 2),
      }],
    }
  },
}

// Start MCP server with the verify tool
const server = createLegalMCPServer({
  name: 'hallucase-verifier',
  version: '0.2.0',
  tools: [verifyTool],
  transport: 'stdio',
})

server.start()
```

### 11.2 Usage from Any MCP Host

```json
// Claude Desktop config
{
  "mcpServers": {
    "hallucase": {
      "command": "npx",
      "args": ["@tensflare/hallucase", "mcp"]
    }
  }
}
```

```typescript
// In Cursor, VS Code, or any MCP host
// "Verify this citation: 410 U.S. 113"
// → MCP calls hallucase_verify tool
// → Returns { status: "verified", confidence: 1.0 }
```

---

## 12. Implementation Plan

### Phase 1A: Core Engine (Day 1-2)

**Day 1:**
- [ ] Add new npm dependencies: `cheerio`, `jspdf`, `p-limit`
- [ ] Create `src/verify/parser.ts` — citation normalization and extraction
- [ ] Create `src/verify/sources/types.ts` — SourceAdapter interface
- [ ] Create `src/verify/sources/courtlistener.ts` — CourtListener adapter
- [ ] Create `src/verify/resolver.ts` — resolution orchestrator
- [ ] Extend `src/schema.ts` with new types (VerifiableCitation, CitationVerification, etc.)

**Day 2:**
- [ ] Create `src/verify/sources/cap.ts` — CAP adapter
- [ ] Create `src/verify/sources/google-scholar.ts` — Google Scholar adapter
- [ ] Create `src/verify/sources/free-law.ts` — Free Law adapter
- [ ] Create `src/verify/sources/local-corpus.ts` — Duct-based local corpus
- [ ] Create `src/verify/consensus.ts` — confidence scoring
- [ ] Create `src/verify/index.ts` — CitationVerifier class

### Phase 1B: CLI & API (Day 3-4)

**Day 3:**
- [ ] Extend `src/cli.ts` — add `verify` command
- [ ] Extend `src/cli.ts` — add `file` command
- [ ] Extend `src/cli.ts` — add `eval` command
- [ ] Extend `src/api/router.ts` — add verify, file, eval endpoints
- [ ] Extend `src/registry/sqlite.ts` — add verifications/compliance tables
- [ ] Extend `src/registry/memory.ts` — add in-memory verification store

**Day 4:**
- [ ] Implement PDF report generation in `src/verify/reporter.ts`
- [ ] Write compliance rules for NY Part 161, FL Rule, CA SB 574
- [ ] Add `hallucase serve` MCP mode (stdio transport)
- [ ] Write tests: parser, resolver, consensus, CLI, API
- [ ] Update README with new commands
- [ ] Update package.json version to 0.2.0-alpha.1

### Phase 1C: Polish & Ship (Day 5)

- [ ] Handle all error cases: network failures, rate limits, unsupported jurisdictions
- [ ] Add `--help` examples for all new commands
- [ ] Test with real briefs (extract text from PDF, run verification)
- [ ] Publish as `hallucase@0.2.0` to npm
- [ ] Update tensflare/hallucase README
- [ ] Post to HN, legal tech forums, Twitter/X

### Phase 2: Clearinghouse (July-September)

- [ ] `hallucase.io/verify` — web UI for submitting documents
- [ ] Aggregated citation index (open dataset: citation → source URLs + verification status)
- [ ] Citation Consensus Score API — queryable by other vendors
- [ ] Rate-limited free tier + enterprise plans
- [ ] Partnerships with Westlaw/Lexis for deeper verification

### Phase 3: Standard (October+)

- [ ] Tensflare Citation Verification Standard specification
- [ ] LexBench compliance testing suite
- [ ] Certification program for AI vendors
- [ ] On-prem deployment package for AmLaw 100

---

## 13. Edge Cases & Failure Modes

| Case | Behavior | Rationale |
|------|----------|-----------|
| All sources down | Status: `unverifiable`, confidence: 0.3 | Don't false-positive as "hallucinated" when it's a network issue |
| Citation not recognized | Status: `unverifiable`, confidence: 0.0 | Return "could not parse" — let the user verify manually |
| Rate limited | Queue requests, return partial results | Better to have partial verification than no verification |
| Non-US citation | Fall back to Google Scholar only | Fewer free sources available; confidence score reflects this |
| Duplicate citations in document | Deduplicate, report once | Statistics still count unique citations correctly |
| PDF with scanned text | Use Duct OCR pipeline if available | Graceful degradation if Duct not installed |
| Extremely long document (1000+ citations) | Process in batches, streaming results | Prevent timeout/memory issues |
| Citation that exists but is irrelevant | Status: `verified`, confidence adjusted | Foundational existence check ≠ relevance check |
| Shepardizing/overruled cases | Status: `verified`, add overruled note | Phase 2 feature — track treatment of precedent |
| Verifying during offline/disconnected | Use local corpus only | Enterprise on-prem use case |

---

## 14. Testing Strategy

### 14.1 Unit Tests

```
test/verify/
├── parser.test.ts       # Citation extraction, normalization, dedup
├── resolver.test.ts     # Source resolution orchestration
├── consensus.test.ts    # Confidence scoring
├── reporter.test.ts     # Compliance report generation
└── sources/             # Mock HTTP for each adapter
    ├── courtlistener.test.ts
    ├── cap.test.ts
    ├── google-scholar.test.ts
    └── free-law.test.ts
```

### 14.2 Integration Tests

```
test/
├── cli-verify.test.ts   # `hallucase verify` end-to-end
├── cli-file.test.ts     # `hallucase file` with real brief
├── cli-eval.test.ts     # `hallucase eval` with compliance report
├── api-verify.test.ts   # POST /api/v1/verify
├── api-file.test.ts     # POST /api/v1/file
└── api-eval.test.ts     # POST /api/v1/eval
```

### 14.3 Test Fixtures

```
test/fixtures/
├── briefs/
│   ├── mata-v-avianca-brief.txt     # Known hallucination case
│   ├── hallucon-2026-brief.txt      # Synthetic brief with 2 hallucinated + 8 real citations
│   └── clean-brief.txt              # Brief with all real citations
├── citations/
│   ├── verified.txt                 # 20 known-good citations
│   ├── hallucinated.txt             # 10 known-hallucinated citations
│   └── edge-cases.txt               # Unusual formats, international
└── expected/
    ├── mata-v-avianca-result.json
    └── clean-brief-result.json
```

### 14.4 Mock Source Server

```typescript
// test/verify/mock-sources.ts

import { createServer } from 'node:http'

export function createMockSourceServer() {
  // Returns a local HTTP server that:
  // - /courtlistener/search/:citation → returns found/not-found
  // - /cap/case/:citation → returns case data
  // - /scholar/search → returns mock HTML
}
```

---

## 15. Performance Budget

| Operation | Target | Threshold |
|-----------|--------|-----------|
| Single citation verification | <2s | <5s |
| Brief verification (50 citations) | <30s | <60s |
| Compliance report gen | +0.5s | +2s |
| CLI startup time | <500ms | <1s |
| API response (POST /verify) | <3s | <8s |
| Concurrent verifications | 10 | 25 |
| Memory per verification | <50MB | <200MB |

---

## 16. Source Adapter Comparison

| Source | Coverage | Rate Limit | Auth Required | Reliability | Priority |
|--------|----------|-----------|---------------|-------------|----------|
| CourtListener | US federal + some state | 2 req/s free, 10+ req/s paid | Free API key (optional) | High | 1 |
| CAP (Harvard) | US federal + state (1658-2024) | 5 req/s | No | High | 2 |
| Free Law Project | US federal + some state | 2 req/s | Free API key | High | 3 |
| Google Scholar | Global (case law) | ~0.5 req/s | No (scraping) | Medium (fragile) | 4 |
| Local Corpus | User-defined | Unlimited | No | Highest | 0 |

---

## 17. Dependencies (added to package.json)

```json
{
  "dependencies": {
    "p-limit": "^6.0.0",
    "cheerio": "^1.0.0",
    "jspdf": "^2.5.0"
  },
  "optionalDependencies": {
    "@docfide/duct": "^0.2.0"
  }
}
```

No heavy ML dependencies. The engine is purely rule-based + API calls. Proposition matching uses simple lexical overlap in Phase 1 (LLM-assisted matching is Phase 2).

---

## 18. Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CourtListener/CAP downtime | Medium | High — US citations unresolvable | Multi-source fallback; local corpus option |
| Google Scholar blocking | Medium | Medium — international citations downgraded | Add jurisdiction-specific adapters over time |
| False positives (marking real citations as hallucinated) | Low | Very high — law firm trust destroyed | Conservative confidence scoring; always label "unverifiable" vs. "hallucinated" |
| False negatives (missing hallucinated citations) | Medium | High — misses the whole point | Multi-source verification; never cite absent sources as verified |
| NY Part 161 delayed | Low | Medium — reduces urgency | Still valuable as general verification tool |
| Rate limiting under load | Medium | Medium — slow verifications | Queue + batch processing; p-limit concurrency control |
| Shepardizing expectation | Medium | High — users expect Westlaw-level treatment info | Explicitly document: Phase 1 = existence check only. Phase 2 = treatment tracking. |
