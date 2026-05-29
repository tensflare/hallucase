import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { HallucinationReport, CreateReportInput, SearchFilters, SearchResult } from '../schema.js'
import { RegistryStore } from './index.js'

export class SqliteRegistryStore implements RegistryStore {
  private db: Database.Database

  constructor(private dbPath: string) {
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  async initialize(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hallucination_reports (
        id TEXT PRIMARY KEY,
        hc_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        hallucination_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        domain TEXT NOT NULL,
        jurisdiction TEXT,
        date_documented TEXT NOT NULL,
        date_occurred TEXT,
        hallucinated_output TEXT NOT NULL,
        expected_correct_output TEXT NOT NULL,
        reproduction_prompt TEXT,
        reproduction_steps TEXT,
        affected_models TEXT,
        source_document_type TEXT,
        source_description TEXT,
        impact_description TEXT,
        sanctions_or_outcome TEXT,
        prevention_playbook TEXT,
        detection_tips TEXT,
        related_hc_ids TEXT,
        reported_by TEXT,
        verified INTEGER NOT NULL DEFAULT 0,
        references TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_hc_id ON hallucination_reports(hc_id)
    `)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_type ON hallucination_reports(hallucination_type)
    `)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_severity ON hallucination_reports(severity)
    `)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_domain ON hallucination_reports(domain)
    `)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_verified ON hallucination_reports(verified)
    `)

  }

  async add(input: CreateReportInput): Promise<HallucinationReport> {
    const now = new Date().toISOString()
    const id = uuidv4()
    const maxRow = this.db.prepare('SELECT COALESCE(MAX(CAST(SUBSTR(hc_id, 4) AS INTEGER)), 0) + 1 as next FROM hallucination_reports').get() as { next: number }
    const nextNum = maxRow.next
    const hcId = `HC-${String(nextNum).padStart(6, '0')}`

    const stmt = this.db.prepare(`
      INSERT INTO hallucination_reports (
        id, hc_id, title, description, hallucination_type, severity, domain, jurisdiction,
        date_documented, date_occurred, hallucinated_output, expected_correct_output,
        reproduction_prompt, reproduction_steps, affected_models, source_document_type,
        source_description, impact_description, sanctions_or_outcome, prevention_playbook,
        detection_tips, related_hc_ids, reported_by, verified, references, created_at, updated_at
      ) VALUES (
        @id, @hc_id, @title, @description, @hallucination_type, @severity, @domain, @jurisdiction,
        @date_documented, @date_occurred, @hallucinated_output, @expected_correct_output,
        @reproduction_prompt, @reproduction_steps, @affected_models, @source_document_type,
        @source_description, @impact_description, @sanctions_or_outcome, @prevention_playbook,
        @detection_tips, @related_hc_ids, @reported_by, @verified, @references, @created_at, @updated_at
      )
    `)

    stmt.run({
      id,
      hc_id: hcId,
      title: input.title,
      description: input.description,
      hallucination_type: input.hallucination_type,
      severity: input.severity ?? 'medium',
      domain: input.domain,
      jurisdiction: input.jurisdiction ?? null,
      date_documented: now,
      date_occurred: input.date_occurred ?? null,
      hallucinated_output: input.hallucinated_output,
      expected_correct_output: input.expected_correct_output,
      reproduction_prompt: input.reproduction_prompt ?? null,
      reproduction_steps: input.reproduction_steps ? JSON.stringify(input.reproduction_steps) : null,
      affected_models: input.affected_models ? JSON.stringify(input.affected_models) : null,
      source_document_type: input.source_document_type ?? null,
      source_description: input.source_description ?? null,
      impact_description: input.impact_description ?? null,
      sanctions_or_outcome: input.sanctions_or_outcome ?? null,
      prevention_playbook: input.prevention_playbook ?? null,
      detection_tips: input.detection_tips ? JSON.stringify(input.detection_tips) : null,
      related_hc_ids: input.related_hc_ids ? JSON.stringify(input.related_hc_ids) : null,
      reported_by: input.reported_by ?? null,
      verified: input.verified ? 1 : 0,
      references: input.references ? JSON.stringify(input.references) : null,
      created_at: now,
      updated_at: now,
    })

    return (await this.get(id))!
  }

  async get(id: string): Promise<HallucinationReport | null> {
    const row = this.db.prepare('SELECT * FROM hallucination_reports WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return this.rowToReport(row)
  }

  async getByHcId(hcId: string): Promise<HallucinationReport | null> {
    const row = this.db.prepare('SELECT * FROM hallucination_reports WHERE hc_id = ?').get(hcId) as Record<string, unknown> | undefined
    if (!row) return null
    return this.rowToReport(row)
  }

  async search(filters: SearchFilters, page = 1, pageSize = 20): Promise<SearchResult> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (filters.q) {
      conditions.push('(title LIKE @q OR description LIKE @q OR hallucinated_output LIKE @q)')
      params.q = `%${filters.q}%`
    }
    if (filters.hallucination_type) {
      conditions.push('hallucination_type = @hallucination_type')
      params.hallucination_type = filters.hallucination_type
    }
    if (filters.severity) {
      conditions.push('severity = @severity')
      params.severity = filters.severity
    }
    if (filters.domain) {
      conditions.push('domain = @domain')
      params.domain = filters.domain
    }
    if (filters.jurisdiction) {
      conditions.push('jurisdiction = @jurisdiction')
      params.jurisdiction = filters.jurisdiction
    }
    if (filters.verified !== undefined) {
      conditions.push('verified = @verified')
      params.verified = filters.verified ? 1 : 0
    }
    if (filters.affected_model) {
      conditions.push('affected_models LIKE @affected_model')
      params.affected_model = `%${filters.affected_model}%`
    }
    if (filters.date_from) {
      conditions.push('date_documented >= @date_from')
      params.date_from = filters.date_from
    }
    if (filters.date_to) {
      conditions.push('date_documented <= @date_to')
      params.date_to = filters.date_to
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * pageSize

    const countRow = this.db.prepare(`SELECT COUNT(*) as total FROM hallucination_reports ${where}`).get(params) as { total: number }
    const total = countRow.total

    const rows = this.db
      .prepare(`SELECT * FROM hallucination_reports ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: pageSize, offset }) as Record<string, unknown>[]

    const results = rows.map((r) => this.rowToReport(r))
    return { total, page, page_size: pageSize, results }
  }

  async update(id: string, input: Partial<CreateReportInput>): Promise<HallucinationReport | null> {
    const existing = this.db.prepare('SELECT * FROM hallucination_reports WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null

    const sets: string[] = ['updated_at = @updated_at']
    const params: Record<string, unknown> = { id, updated_at: new Date().toISOString() }

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue
      const col = key
      sets.push(`${col} = @${col}`)
      if (Array.isArray(value)) {
        params[col] = JSON.stringify(value)
      } else if (typeof value === 'boolean') {
        params[col] = value ? 1 : 0
      } else {
        params[col] = value
      }
    }

    this.db.prepare(`UPDATE hallucination_reports SET ${sets.join(', ')} WHERE id = @id`).run(params)

    return this.get(id)
  }

  async remove(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM hallucination_reports WHERE id = ?').run(id)
    return result.changes > 0
  }

  async stats(): Promise<{ total: number; byType: Record<string, number>; bySeverity: Record<string, number> }> {
    const totalRow = this.db.prepare('SELECT COUNT(*) as total FROM hallucination_reports').get() as { total: number }
    const typeRows = this.db.prepare('SELECT hallucination_type, COUNT(*) as cnt FROM hallucination_reports GROUP BY hallucination_type').all() as { hallucination_type: string; cnt: number }[]
    const severityRows = this.db.prepare('SELECT severity, COUNT(*) as cnt FROM hallucination_reports GROUP BY severity').all() as { severity: string; cnt: number }[]

    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    for (const r of typeRows) byType[r.hallucination_type] = r.cnt
    for (const r of severityRows) bySeverity[r.severity] = r.cnt

    return { total: totalRow.total, byType, bySeverity }
  }

  close(): void {
    this.db.close()
  }

  private rowToReport(row: Record<string, unknown>): HallucinationReport {
    return {
      id: row.id as string,
      hc_id: row.hc_id as string,
      title: row.title as string,
      description: row.description as string,
      hallucination_type: row.hallucination_type as HallucinationReport['hallucination_type'],
      severity: row.severity as HallucinationReport['severity'],
      domain: row.domain as string,
      jurisdiction: (row.jurisdiction as string) ?? undefined,
      date_documented: row.date_documented as string,
      date_occurred: (row.date_occurred as string) ?? undefined,
      hallucinated_output: row.hallucinated_output as string,
      expected_correct_output: row.expected_correct_output as string,
      reproduction_prompt: (row.reproduction_prompt as string) ?? undefined,
      reproduction_steps: row.reproduction_steps ? JSON.parse(row.reproduction_steps as string) : undefined,
      affected_models: row.affected_models ? JSON.parse(row.affected_models as string) : undefined,
      source_document_type: (row.source_document_type as string) ?? undefined,
      source_description: (row.source_description as string) ?? undefined,
      impact_description: (row.impact_description as string) ?? undefined,
      sanctions_or_outcome: (row.sanctions_or_outcome as string) ?? undefined,
      prevention_playbook: (row.prevention_playbook as string) ?? undefined,
      detection_tips: row.detection_tips ? JSON.parse(row.detection_tips as string) : undefined,
      related_hc_ids: row.related_hc_ids ? JSON.parse(row.related_hc_ids as string) : undefined,
      reported_by: (row.reported_by as string) ?? undefined,
      verified: row.verified === 1 || row.verified === true,
      references: row.references ? JSON.parse(row.references as string) : undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }
  }
}
