# HalluCase Report Schema

## Overview

Each HalluCase report describes a single documented hallucination incident involving an AI system in a legal context. Reports follow a structured schema designed to capture all relevant information for tracking, reproducing, and preventing future occurrences.

## Identifier Format

Reports are identified by a UUID (`id`) and a human-readable HalluCase ID (`hc_id`):

```
HC-XXXXXX
```

Where `XXXXXX` is a zero-padded sequential number (e.g., `HC-000001`, `HC-000042`, `HC-000103`).

## Complete Schema

### Required Fields

```typescript
{
  // UUID v4 identifier
  "id": "550e8400-e29b-41d4-a716-446655440000",

  // HalluCase ID in HC-XXXXXX format
  "hc_id": "HC-000001",

  // Short title (5-200 characters)
  "title": "Fabricated Contract Clause in MSA",

  // Detailed description (minimum 20 characters)
  "description": "AI generated a non-existent limitation of liability clause...",

  // Type of hallucination
  "hallucination_type": "fabricated_contract_clause",

  // Impact severity
  "severity": "high",

  // Legal domain
  "domain": "contracts",

  // ISO 8601 timestamp when documented
  "date_documented": "2025-06-15T10:00:00.000Z",

  // What the AI produced
  "hallucinated_output": "Under California Civil Code Section 1717.5...",

  // What should have been produced
  "expected_correct_output": "California Civil Code Section 1717 governs...",

  // ISO 8601 timestamps
  "created_at": "2025-06-15T10:00:00.000Z",
  "updated_at": "2025-06-15T10:00:00.000Z"
}
```

### Optional Fields

```typescript
{
  // When the hallucination occurred
  "date_occurred": "2025-06-14T14:30:00.000Z",

  // Jurisdiction code
  "jurisdiction": "US-CA",

  // The prompt that triggered the hallucination
  "reproduction_prompt": "Draft a limitation of liability clause for...",

  // Step-by-step reproduction instructions
  "reproduction_steps": [
    "Open ChatGPT with GPT-4",
    "Enter the prompt: 'Draft a limitation of liability clause...'",
    "Observe the fabricated statute citation"
  ],

  // Affected AI models
  "affected_models": [
    {
      "provider": "OpenAI",
      "model": "GPT-4",
      "version": "gpt-4-turbo-2025-04",
      "configuration": "temperature=0.7"
    }
  ],

  // Source document context
  "source_document_type": "Master Services Agreement",
  "source_description": "Section 12 of a 50-page MSA between two SaaS companies",

  // Impact assessment
  "impact_description": "The fabricated clause would have limited liability to $50K...",
  "sanctions_or_outcome": "Attorney sanctioned $5,000 by the court",

  // Prevention information
  "prevention_playbook": "Always verify statute citations against official California code...",
  "detection_tips": [
    "Cross-reference all statute numbers with official state codes",
    "Look for section numbers that follow unusual patterns"
  ],

  // Related reports
  "related_hc_ids": ["HC-000002", "HC-000015"],

  // Reporter information
  "reported_by": "legal-team@lawfirm.com",

  // Verification status
  "verified": true,

  // Reference URLs
  "references": [
    "https://example.com/court-order-sanction.pdf",
    "https://example.com/original-brief.pdf"
  ]
}
```

## Hallucination Types

| Type | Description | Example |
|------|-------------|---------|
| `fake_citation` | AI cites a non-existent case, statute, or document | `Anderson v. TechCorp, 987 F.3d 456 (9th Cir. 2025)` — does not exist |
| `misquoted_statute` | References a real statute but gets its content wrong | Claims CA Civ Code §1717.5 exists (it doesn't) |
| `fabricated_contract_clause` | Generates contract language that isn't standard | A "mutual AI training clause" in a standard NDA |
| `incorrect_legal_standard` | Applies wrong legal test | Using strict scrutiny for a commercial speech case |
| `fabricated_obligation` | Claims non-existent legal duty | "All contracts must be notarized under federal law" |
| `misstated_jurisdiction_law` | Wrong law for a jurisdiction | Stating California follows community property in contracts |
| `incorrect_procedural_rule` | Wrong court procedure | "Summary judgment requires a jury trial first" |
| `hallucinated_precedent` | Fabricated case law | A detailed case holding that was never decided |
| `other` | Any other hallucination type | |

## Severity Levels

| Level | Criteria | Examples |
|-------|----------|---------|
| `critical` | Would cause certain sanctions, adverse outcome, or ethical violation | Filing a brief with fake cases; executing a contract with fabricated terms |
| `high` | Likely to cause material harm | Materially misleading legal advice; incorrect tax or regulatory analysis |
| `medium` | Potentially misleading but less likely to cause direct harm | Incorrect citation format; wrong but harmless statute reference |
| `low` | Minor inaccuracies | Wrong date; misspelled case name; outdated but correct-sounding rule |
| `info` | Informational, no direct harm | Documenting an interesting pattern; comparative model behavior |

## Example: Complete Report

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "hc_id": "HC-000001",
  "title": "Fabricated Contract Clause in MSA",
  "description": "AI generated a non-existent limitation of liability clause in a Master Services Agreement, citing a California statute that does not exist.",
  "hallucination_type": "fabricated_contract_clause",
  "severity": "high",
  "domain": "contracts",
  "jurisdiction": "US-CA",
  "date_documented": "2025-06-15T10:00:00.000Z",
  "date_occurred": "2025-06-14T14:30:00.000Z",
  "hallucinated_output": "Under California Civil Code Section 1717.5, limitation of liability clauses are void if they do not include the phrase 'mutual consideration.'",
  "expected_correct_output": "California Civil Code Section 1717 governs attorney fees but does not address limitations of liability. No Section 1717.5 exists. The correct governing statute is Civil Code Section 1668.",
  "reproduction_prompt": "Draft a limitation of liability clause for a California-based SaaS MSA. Reference the relevant California statute.",
  "reproduction_steps": [
    "Open ChatGPT (GPT-4, temperature 0.7)",
    "Enter the prompt as specified above",
    "Review the output for statute citations",
    "Verify citations against official California code"
  ],
  "affected_models": [
    {
      "provider": "OpenAI",
      "model": "GPT-4",
      "version": "gpt-4-turbo-2025-04",
      "configuration": "temperature=0.7"
    }
  ],
  "source_document_type": "Master Services Agreement",
  "source_description": "Section 12 of a 50-page MSA between two SaaS companies being reviewed by in-house counsel",
  "impact_description": "If undetected, this would have resulted in a limitation of liability that was unenforceable under California law, potentially exposing the company to unlimited liability.",
  "prevention_playbook": "Always verify AI-generated statute citations against official state code databases. Use legal research tools (Westlaw, LexisNexis) to validate all statutory references before incorporating into final documents.",
  "detection_tips": [
    "Cross-reference all statute numbers with official state codes",
    "Look for section numbers that follow unusual patterns (1717.5 is not a real section)",
    "Verify case citations on PACER or Google Scholar"
  ],
  "related_hc_ids": ["HC-000002"],
  "reported_by": "inhouse-counsel@example.com",
  "verified": true,
  "references": ["https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1717"],
  "created_at": "2025-06-15T10:00:00.000Z",
  "updated_at": "2025-06-15T14:00:00.000Z"
}
```
