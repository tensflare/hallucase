import { HallucinationReport, CreateReportInput, SearchFilters, SearchResult } from '../schema.js'

export interface RegistryStore {
  initialize(): Promise<void>
  add(input: CreateReportInput): Promise<HallucinationReport>
  get(id: string): Promise<HallucinationReport | null>
  getByHcId(hcId: string): Promise<HallucinationReport | null>
  search(filters: SearchFilters, page?: number, pageSize?: number): Promise<SearchResult>
  update(id: string, input: Partial<CreateReportInput>): Promise<HallucinationReport | null>
  remove(id: string): Promise<boolean>
  stats(): Promise<{ total: number; byType: Record<string, number>; bySeverity: Record<string, number> }>
  close(): void
}
