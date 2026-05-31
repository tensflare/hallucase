import { describe, it, expect } from 'vitest'
import { HallucinationReport, CreateReportInput, SearchFilters, SeverityLevel, HallucinationType } from '../src/schema.js'

function validReport(): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    hc_id: 'HC-000001',
    title: 'Fabricated Contract Clause in MSA',
    description: 'AI generated a non-existent limitation of liability clause in a Master Services Agreement, citing a California statute that does not exist.',
    hallucination_type: 'fabricated_contract_clause',
    severity: 'high',
    domain: 'contracts',
    jurisdiction: 'US-CA',
    date_documented: '2025-06-15T10:00:00.000Z',
    hallucinated_output: 'Under California Civil Code Section 1717.5, limitation of liability clauses are void if they do not include the phrase "mutual consideration."',
    expected_correct_output: 'California Civil Code Section 1717 governs attorney fees but does not address limitations of liability. No Section 1717.5 exists.',
    affected_models: [
      { provider: 'OpenAI', model: 'GPT-4', version: 'gpt-4-turbo-2025-04', configuration: 'temperature=0.7' },
    ],
    reported_by: 'legal-team@lawfirm.com',
    verified: true,
    references: ['https://example.com/report/1'],
    created_at: '2025-06-15T10:00:00.000Z',
    updated_at: '2025-06-15T10:00:00.000Z',
  }
}

describe('HallucinationReport schema', () => {
  it('validates a correct report', () => {
    const result = HallucinationReport.safeParse(validReport())
    expect(result.success).toBe(true)
  })

  it('generates a valid HC-ID format', () => {
    const result = HallucinationReport.safeParse(validReport())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.hc_id).toMatch(/^HC-\d{6}$/)
    }
  })

  it('rejects a report with missing required fields', () => {
    const result = HallucinationReport.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('id')
      expect(paths).toContain('hc_id')
      expect(paths).toContain('title')
      expect(paths).toContain('description')
    }
  })

  it('rejects a report with short title', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), title: 'ABC' })
    expect(result.success).toBe(false)
  })

  it('rejects a report with short description', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), description: 'Too short' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid HC-ID format', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), hc_id: 'HC-001' })
    expect(result.success).toBe(false)
    const result2 = HallucinationReport.safeParse({ ...validReport(), hc_id: 'HC-00001X' })
    expect(result2.success).toBe(false)
  })

  it('rejects an invalid UUID', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hallucination type', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), hallucination_type: 'invalid_type' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid severity', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), severity: 'extreme' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid datetime format', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), date_documented: '2025-06-15' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid URL in references', () => {
    const result = HallucinationReport.safeParse({ ...validReport(), references: ['not-a-url'] })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields being absent', () => {
    const minimal = {
      ...validReport(),
      jurisdiction: undefined,
      date_occurred: undefined,
      reproduction_prompt: undefined,
      reproduction_steps: undefined,
      affected_models: undefined,
      source_document_type: undefined,
      source_description: undefined,
      impact_description: undefined,
      sanctions_or_outcome: undefined,
      prevention_playbook: undefined,
      detection_tips: undefined,
      related_hc_ids: undefined,
      reported_by: undefined,
      references: undefined,
    }
    const result = HallucinationReport.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  it('defaults verified to false', () => {
    const withoutVerified = { ...validReport() }
    delete withoutVerified.verified
    const result = HallucinationReport.safeParse(withoutVerified)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.verified).toBe(false)
    }
  })

  it('enforces title max length', () => {
    const longTitle = 'A'.repeat(201)
    const result = HallucinationReport.safeParse({ ...validReport(), title: longTitle })
    expect(result.success).toBe(false)
  })

  it('accepts all hallucination types', () => {
    for (const htype of HallucinationType.options) {
      const result = HallucinationReport.safeParse({ ...validReport(), hallucination_type: htype })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all severity levels', () => {
    for (const level of SeverityLevel.options) {
      const result = HallucinationReport.safeParse({ ...validReport(), severity: level })
      expect(result.success).toBe(true)
    }
  })
})

describe('CreateReportInput schema', () => {
  it('accepts valid input without id/hc_id/dates', () => {
    const input = {
      title: 'Fabricated Precedent in Brief',
      description: 'AI hallucinated a Supreme Court precedent in a legal brief submission.',
      hallucination_type: 'hallucinated_precedent',
      severity: 'critical',
      domain: 'litigation',
      hallucinated_output: 'In Doe v. Smith, 580 U.S. 123 (2024), the Supreme Court held...',
      expected_correct_output: 'No such case exists. The correct precedent is...',
    }
    const result = CreateReportInput.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects input without required fields', () => {
    const result = CreateReportInput.safeParse({ title: 'Incomplete' })
    expect(result.success).toBe(false)
  })

  it('allows severity and verified to be omitted', () => {
    const input = {
      title: 'Misquoted Statute in Merger',
      description: 'AI misquoted Delaware General Corporation Law in a merger agreement review.',
      hallucination_type: 'misquoted_statute',
      domain: 'corporate',
      hallucinated_output: 'DGCL Section 251(h) requires shareholder vote for all mergers.',
      expected_correct_output: 'DGCL Section 251(h) provides exceptions to shareholder vote under certain conditions.',
    }
    const result = CreateReportInput.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('accepts explicit severity and verified values', () => {
    const input = {
      title: 'Test Report',
      description: 'A test report with explicit severity and verified values for validation.',
      hallucination_type: 'fake_citation',
      severity: 'critical',
      domain: 'litigation',
      hallucinated_output: 'Test output',
      expected_correct_output: 'Test expected output',
      verified: true,
    }
    const result = CreateReportInput.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.severity).toBe('critical')
      expect(result.data.verified).toBe(true)
    }
  })
})

describe('SearchFilters schema', () => {
  it('accepts empty filters', () => {
    const result = SearchFilters.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts all filter fields', () => {
    const filters = {
      q: 'test query',
      hallucination_type: 'fake_citation',
      severity: 'high',
      domain: 'contracts',
      jurisdiction: 'US-CA',
      affected_model: 'GPT-4',
      verified: true,
      date_from: '2025-01-01T00:00:00.000Z',
      date_to: '2025-12-31T23:59:59.000Z',
    }
    const result = SearchFilters.safeParse(filters)
    expect(result.success).toBe(true)
  })

  it('rejects invalid hallucination type in filter', () => {
    const result = SearchFilters.safeParse({ hallucination_type: 'nonsense' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid severity in filter', () => {
    const result = SearchFilters.safeParse({ severity: 'nonsense' })
    expect(result.success).toBe(false)
  })
})
