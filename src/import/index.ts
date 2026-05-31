import { readFileSync, existsSync } from 'fs'
import { parse } from 'path'
import { CreateReportInput, HallucinationType, SeverityLevel } from '../schema.js'
import { RegistryStore } from '../registry/index.js'

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export interface ImportOptions {
  dryRun?: boolean
}

export type ImportSource = 'charlotin' | 'json' | 'csv'

function inferHallucinationType(raw: string): HallucinationType {
  const lower = raw.toLowerCase()
  if (lower.includes('citation') || lower.includes('cite') || lower.includes('case')) return 'fake_citation'
  if (lower.includes('statute') || lower.includes('statutory') || lower.includes('law')) return 'misquoted_statute'
  if (lower.includes('clause') || lower.includes('term') || lower.includes('contract')) return 'fabricated_contract_clause'
  if (lower.includes('standard') || lower.includes('test') || lower.includes('doctrine')) return 'incorrect_legal_standard'
  if (lower.includes('obligation') || lower.includes('duty') || lower.includes('require')) return 'fabricated_obligation'
  if (lower.includes('jurisdiction') || lower.includes('venue') || lower.includes('choice of law')) return 'misstated_jurisdiction_law'
  if (lower.includes('procedure') || lower.includes('motion') || lower.includes('filing') || lower.includes('rule')) return 'incorrect_procedural_rule'
  if (lower.includes('precedent') || lower.includes('holding') || lower.includes('opinion')) return 'hallucinated_precedent'
  return 'other'
}

function inferSeverity(raw: string): SeverityLevel {
  const lower = raw.toLowerCase()
  if (lower.includes('critical') || lower.includes('sanction') || lower.includes('fine')) return 'critical'
  if (lower.includes('high') || lower.includes('significant') || lower.includes('material')) return 'high'
  if (lower.includes('medium') || lower.includes('moderate')) return 'medium'
  if (lower.includes('low') || lower.includes('minor')) return 'low'
  return 'info'
}

function parseCharlotinRow(headers: string[], row: string[]): Partial<CreateReportInput> | null {
  const get = (field: string): string => {
    const idx = headers.indexOf(field)
    return idx >= 0 ? (row[idx] ?? '').trim() : ''
  }

  const title = get('Title') || get('title') || get('incident_title')
  const description = get('Description') || get('description') || get('summary')
  const hallucinated = get('Hallucinated Output') || get('hallucinated_output') || get('ai_output')
  const expected = get('Expected Output') || get('expected_correct_output') || get('correct_output')
  const rawType = get('Type') || get('hallucination_type') || get('category')
  const rawSeverity = get('Severity') || get('severity') || get('impact')
  const domain = get('Domain') || get('domain') || get('practice_area')
  const jurisdiction = get('Jurisdiction') || get('jurisdiction')

  if (!title || !description) return null

  return {
    title,
    description,
    hallucinated_output: hallucinated || description,
    expected_correct_output: expected || 'Not provided',
    hallucination_type: rawType ? inferHallucinationType(rawType) : 'other',
    severity: rawSeverity ? inferSeverity(rawSeverity) : 'medium',
    domain: domain || 'unknown',
    jurisdiction: jurisdiction || undefined,
    date_occurred: undefined,
    affected_models: undefined,
  }
}

export async function importFromCharlotin(filePath: string, store: RegistryStore, options: ImportOptions = {}): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] }

  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

    if (lines.length < 2) {
      result.errors.push('File has no data rows')
      return result
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i])
        const parsed = parseCharlotinRow(headers, values)
        if (parsed) {
          if (!options.dryRun) {
            try {
              await store.add(parsed as CreateReportInput)
              result.imported++
            } catch (err) {
              result.errors.push(`Row ${i}: ${(err as Error).message}`)
              result.skipped++
            }
          } else {
            result.imported++
          }
        } else {
          result.skipped++
        }
      } catch {
        result.skipped++
      }
    }
  } catch (err) {
    result.errors.push(`Failed to read file: ${(err as Error).message}`)
  }

  return result
}

export async function importFromJSON(filePath: string, store: RegistryStore, options: ImportOptions = {}): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] }

  try {
    const content = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)
    const reports = Array.isArray(data) ? data : data.reports ?? [data]

    for (const [i, item] of reports.entries()) {
      try {
        if (item.title && item.description && item.hallucinated_output && item.expected_correct_output) {
          if (!options.dryRun) {
            try {
              await store.add(item as CreateReportInput)
              result.imported++
            } catch (err) {
              result.errors.push(`Item ${i}: ${(err as Error).message}`)
              result.skipped++
            }
          } else {
            result.imported++
          }
        } else {
          result.skipped++
        }
      } catch {
        result.skipped++
      }
    }
  } catch (err) {
    result.errors.push(`Failed to parse JSON: ${(err as Error).message}`)
  }

  return result
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ''))
  return values
}

export function detectImportFormat(filePath: string): ImportSource {
  const ext = parse(filePath).ext.toLowerCase()
  if (ext === '.json') return 'json'
  if (ext === '.csv') return 'charlotin'
  return 'charlotin'
}

export async function importReports(filePath: string, store: RegistryStore, options: ImportOptions = {}): Promise<ImportResult> {
  if (!existsSync(filePath)) {
    return { imported: 0, skipped: 0, errors: [`File not found: ${filePath}`] }
  }

  const format = detectImportFormat(filePath)
  switch (format) {
    case 'charlotin':
      return importFromCharlotin(filePath, store, options)
    case 'json':
      return importFromJSON(filePath, store, options)
    default:
      return importFromCharlotin(filePath, store, options)
  }
}
