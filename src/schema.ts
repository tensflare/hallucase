import { z } from 'zod'

export const SeverityLevel = z.enum(['critical', 'high', 'medium', 'low', 'info'])
export type SeverityLevel = z.infer<typeof SeverityLevel>

export const HallucinationType = z.enum([
  'fake_citation',
  'misquoted_statute',
  'fabricated_contract_clause',
  'incorrect_legal_standard',
  'fabricated_obligation',
  'misstated_jurisdiction_law',
  'incorrect_procedural_rule',
  'hallucinated_precedent',
  'other',
])
export type HallucinationType = z.infer<typeof HallucinationType>

export const AffectedModel = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  version: z.string().optional(),
  configuration: z.string().optional(),
})
export type AffectedModel = z.infer<typeof AffectedModel>

export const HallucinationReport = z.object({
  id: z.string().uuid(),
  hc_id: z.string().regex(/^HC-\d{6}$/),
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  hallucination_type: HallucinationType,
  severity: SeverityLevel,
  domain: z.string(),
  jurisdiction: z.string().optional(),
  date_documented: z.string().datetime(),
  date_occurred: z.string().datetime().optional(),
  hallucinated_output: z.string(),
  expected_correct_output: z.string(),
  reproduction_prompt: z.string().optional(),
  reproduction_steps: z.array(z.string()).optional(),
  affected_models: z.array(AffectedModel).optional(),
  source_document_type: z.string().optional(),
  source_description: z.string().optional(),
  impact_description: z.string().optional(),
  sanctions_or_outcome: z.string().optional(),
  prevention_playbook: z.string().optional(),
  detection_tips: z.array(z.string()).optional(),
  related_hc_ids: z.array(z.string()).optional(),
  reported_by: z.string().optional(),
  verified: z.boolean().default(false),
  references: z.array(z.string().url()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type HallucinationReport = z.infer<typeof HallucinationReport>

export const CreateReportInput = HallucinationReport.omit({
  id: true,
  hc_id: true,
  date_documented: true,
  created_at: true,
  updated_at: true,
}).partial({
  verified: true,
  severity: true,
})
export type CreateReportInput = z.infer<typeof CreateReportInput>

export const SearchFilters = z.object({
  q: z.string().optional(),
  hallucination_type: HallucinationType.optional(),
  severity: SeverityLevel.optional(),
  domain: z.string().optional(),
  jurisdiction: z.string().optional(),
  affected_model: z.string().optional(),
  verified: z.boolean().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
})
export type SearchFilters = z.infer<typeof SearchFilters>

export const SearchResult = z.object({
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  results: z.array(HallucinationReport),
})
export type SearchResult = z.infer<typeof SearchResult>
