import { v4 as uuidv4 } from 'uuid'
import { HallucinationReport, CreateReportInput, SearchFilters, SearchResult } from '../schema.js'
import { RegistryStore } from './index.js'

export class MemoryRegistryStore implements RegistryStore {
  private reports: Map<string, HallucinationReport> = new Map()
  private hcCounter = 0

  async initialize(): Promise<void> {
    this.reports.clear()
    this.hcCounter = 0
  }

  async add(input: CreateReportInput): Promise<HallucinationReport> {
    this.hcCounter++
    const now = new Date().toISOString()
    const hcId = `HC-${String(this.hcCounter).padStart(6, '0')}`
    const report: HallucinationReport = {
      id: uuidv4(),
      hc_id: hcId,
      title: input.title,
      description: input.description,
      hallucination_type: input.hallucination_type,
      severity: input.severity ?? 'medium',
      domain: input.domain,
      jurisdiction: input.jurisdiction,
      date_documented: now,
      date_occurred: input.date_occurred,
      hallucinated_output: input.hallucinated_output,
      expected_correct_output: input.expected_correct_output,
      reproduction_prompt: input.reproduction_prompt,
      reproduction_steps: input.reproduction_steps,
      affected_models: input.affected_models,
      source_document_type: input.source_document_type,
      source_description: input.source_description,
      impact_description: input.impact_description,
      sanctions_or_outcome: input.sanctions_or_outcome,
      prevention_playbook: input.prevention_playbook,
      detection_tips: input.detection_tips,
      related_hc_ids: input.related_hc_ids,
      reported_by: input.reported_by,
      verified: input.verified ?? false,
      references: input.references,
      created_at: now,
      updated_at: now,
    }
    this.reports.set(report.id, report)
    this.reports.set(report.hc_id, report)
    return report
  }

  async get(id: string): Promise<HallucinationReport | null> {
    return this.reports.get(id) ?? null
  }

  async getByHcId(hcId: string): Promise<HallucinationReport | null> {
    return this.reports.get(hcId) ?? null
  }

  async search(filters: SearchFilters, page = 1, pageSize = 20): Promise<SearchResult> {
    const seen = new Set<string>()
    let results = Array.from(this.reports.values()).filter((r) => {
      if (seen.has(r.hc_id)) return false
      seen.add(r.hc_id)
      return true
    })

    results = results.filter((r) => {
      if (filters.q) {
        const q = filters.q.toLowerCase()
        const match =
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.hallucinated_output.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filters.hallucination_type && r.hallucination_type !== filters.hallucination_type) return false
      if (filters.severity && r.severity !== filters.severity) return false
      if (filters.domain && r.domain !== filters.domain) return false
      if (filters.jurisdiction && r.jurisdiction !== filters.jurisdiction) return false
      if (filters.verified !== undefined && r.verified !== filters.verified) return false
      if (filters.affected_model) {
        const hasModel = (r.affected_models ?? []).some(
          (m) =>
            m.provider.toLowerCase().includes(filters.affected_model!.toLowerCase()) ||
            m.model.toLowerCase().includes(filters.affected_model!.toLowerCase()),
        )
        if (!hasModel) return false
      }
      if (filters.date_from && new Date(r.date_documented) < new Date(filters.date_from)) return false
      if (filters.date_to && new Date(r.date_documented) > new Date(filters.date_to)) return false
      return true
    })

    const total = results.length
    const start = (page - 1) * pageSize
    const paged = results.slice(start, start + pageSize)

    return { total, page, page_size: pageSize, results: paged }
  }

  async update(id: string, input: Partial<CreateReportInput>): Promise<HallucinationReport | null> {
    const existing = this.reports.get(id)
    if (!existing) return null

    const updated: HallucinationReport = {
      ...existing,
      ...input,
      severity: input.severity ?? existing.severity,
      verified: input.verified ?? existing.verified,
      updated_at: new Date().toISOString(),
    }

    this.reports.set(id, updated)
    this.reports.set(updated.hc_id, updated)
    return updated
  }

  async remove(id: string): Promise<boolean> {
    const report = this.reports.get(id)
    if (!report) return false
    this.reports.delete(id)
    this.reports.delete(report.hc_id)
    return true
  }

  close(): void {
    // no-op for memory store
  }

  async stats(): Promise<{ total: number; byType: Record<string, number>; bySeverity: Record<string, number> }> {
    const seen = new Set<string>()
    const reports = Array.from(this.reports.values()).filter((r) => {
      if (seen.has(r.hc_id)) return false
      seen.add(r.hc_id)
      return true
    })
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    for (const r of reports) {
      byType[r.hallucination_type] = (byType[r.hallucination_type] ?? 0) + 1
      bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1
    }

    return { total: reports.length, byType, bySeverity }
  }
}
