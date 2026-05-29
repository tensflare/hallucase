import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRegistryStore } from '../src/registry/memory.js'
import { CreateReportInput } from '../src/schema.js'

function sampleInput(overrides: Partial<CreateReportInput> = {}): CreateReportInput {
  return {
    title: 'Fabricated Case Citation in Brief',
    description: 'AI generated a non-existent court case citation in a legal memorandum, claiming it established a precedent that does not exist.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'US-CA',
    hallucinated_output: 'In "Anderson v. TechCorp, 987 F.3d 456 (9th Cir. 2025)," the court held that...',
    expected_correct_output: 'No such case exists. The correct citation should reference the actual precedent...',
    affected_models: [{ provider: 'Anthropic', model: 'Claude 3', version: 'claude-3-opus' }],
    reported_by: 'test-user',
    verified: false,
    ...overrides,
  }
}

describe('MemoryRegistryStore', () => {
  let store: MemoryRegistryStore

  beforeEach(async () => {
    store = new MemoryRegistryStore()
    await store.initialize()
  })

  it('starts empty', async () => {
    const result = await store.search({})
    expect(result.total).toBe(0)
    expect(result.results).toHaveLength(0)
  })

  it('adds a report and returns it with generated id and hc_id', async () => {
    const report = await store.add(sampleInput())
    expect(report.id).toBeDefined()
    expect(report.hc_id).toMatch(/^HC-\d{6}$/)
    expect(report.title).toBe('Fabricated Case Citation in Brief')
    expect(report.created_at).toBeDefined()
    expect(report.updated_at).toBeDefined()
  })

  it('retrieves a report by UUID', async () => {
    const report = await store.add(sampleInput())
    const retrieved = await store.get(report.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.id).toBe(report.id)
  })

  it('retrieves a report by HC-ID', async () => {
    const report = await store.add(sampleInput())
    const retrieved = await store.getByHcId(report.hc_id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.hc_id).toBe(report.hc_id)
  })

  it('returns null for non-existent report', async () => {
    const retrieved = await store.get('non-existent-id')
    expect(retrieved).toBeNull()
  })

  it('returns null for non-existent HC-ID', async () => {
    const retrieved = await store.getByHcId('HC-999999')
    expect(retrieved).toBeNull()
  })

  it('updates a report', async () => {
    const report = await store.add(sampleInput())
    const updated = await store.update(report.id, { title: 'Updated Title', verified: true })
    expect(updated).not.toBeNull()
    expect(updated!.title).toBe('Updated Title')
    expect(updated!.verified).toBe(true)
  })

  it('returns null when updating non-existent report', async () => {
    const updated = await store.update('non-existent', { title: 'Nope' })
    expect(updated).toBeNull()
  })

  it('removes a report', async () => {
    const report = await store.add(sampleInput())
    const removed = await store.remove(report.id)
    expect(removed).toBe(true)
    const retrieved = await store.get(report.id)
    expect(retrieved).toBeNull()
  })

  it('returns false when removing non-existent report', async () => {
    const removed = await store.remove('non-existent')
    expect(removed).toBe(false)
  })

  it('searches by full text query', async () => {
    await store.add(sampleInput({ title: 'Specific Hallucination About Venue' }))
    await store.add(sampleInput({ title: 'Something Else Entirely' }))
    const result = await store.search({ q: 'Venue' })
    expect(result.total).toBe(1)
    expect(result.results[0].title).toContain('Venue')
  })

  it('searches by hallucination type', async () => {
    await store.add(sampleInput({ hallucination_type: 'fake_citation' }))
    await store.add(sampleInput({ hallucination_type: 'misquoted_statute', title: 'Statute Error' }))
    const result = await store.search({ hallucination_type: 'fake_citation' })
    expect(result.total).toBe(1)
    expect(result.results[0].hallucination_type).toBe('fake_citation')
  })

  it('searches by severity', async () => {
    await store.add(sampleInput({ severity: 'critical' }))
    await store.add(sampleInput({ severity: 'low', title: 'Low Severity Issue' }))
    const result = await store.search({ severity: 'critical' })
    expect(result.total).toBe(1)
  })

  it('searches by domain', async () => {
    await store.add(sampleInput({ domain: 'contracts', title: 'Contracts Issue' }))
    await store.add(sampleInput({ domain: 'litigation', title: 'Litigation Issue' }))
    const result = await store.search({ domain: 'contracts' })
    expect(result.total).toBe(1)
  })

  it('searches by jurisdiction', async () => {
    await store.add(sampleInput({ jurisdiction: 'US-CA', title: 'California Issue' }))
    await store.add(sampleInput({ jurisdiction: 'UK', title: 'UK Issue' }))
    const result = await store.search({ jurisdiction: 'US-CA' })
    expect(result.total).toBe(1)
  })

  it('searches by verified status', async () => {
    await store.add(sampleInput({ verified: true, title: 'Verified One' }))
    await store.add(sampleInput({ verified: false, title: 'Unverified One' }))
    const result = await store.search({ verified: true })
    expect(result.total).toBe(1)
    expect(result.results[0].verified).toBe(true)
  })

  it('searches by affected model', async () => {
    await store.add(sampleInput({ affected_models: [{ provider: 'OpenAI', model: 'GPT-4' }], title: 'GPT Issue' }))
    await store.add(sampleInput({ affected_models: [{ provider: 'Anthropic', model: 'Claude' }], title: 'Claude Issue' }))
    const result = await store.search({ affected_model: 'GPT' })
    expect(result.total).toBe(1)
  })

  it('paginates results', async () => {
    for (let i = 0; i < 10; i++) {
      await store.add(sampleInput({ title: `Report ${i + 1}` }))
    }
    const page1 = await store.search({}, 1, 3)
    expect(page1.total).toBe(10)
    expect(page1.results).toHaveLength(3)
    expect(page1.page).toBe(1)
    expect(page1.page_size).toBe(3)

    const page2 = await store.search({}, 2, 3)
    expect(page2.results).toHaveLength(3)
  })

  it('generates sequential HC-IDs', async () => {
    const r1 = await store.add(sampleInput({ title: 'First' }))
    const r2 = await store.add(sampleInput({ title: 'Second' }))
    const r3 = await store.add(sampleInput({ title: 'Third' }))
    expect(r1.hc_id).toBe('HC-000001')
    expect(r2.hc_id).toBe('HC-000002')
    expect(r3.hc_id).toBe('HC-000003')
  })

  it('reports stats', async () => {
    await store.add(sampleInput({ hallucination_type: 'fake_citation', severity: 'high' }))
    await store.add(sampleInput({ hallucination_type: 'fake_citation', severity: 'critical', title: 'Critical Fake Citation' }))
    await store.add(sampleInput({ hallucination_type: 'misquoted_statute', severity: 'medium', title: 'Statute Issue' }))
    const stats = await store.stats()
    expect(stats.total).toBe(3)
    expect(stats.byType['fake_citation']).toBe(2)
    expect(stats.byType['misquoted_statute']).toBe(1)
    expect(Object.keys(stats.bySeverity)).toContain('high')
    expect(Object.keys(stats.bySeverity)).toContain('critical')
  })

  it('applies default severity and verified when store adds report', async () => {
    const report = await store.add({
      title: 'Test Defaults',
      description: 'Testing default severity and verified values in store.',
      hallucination_type: 'fake_citation',
      domain: 'test',
      hallucinated_output: 'Test output',
      expected_correct_output: 'Expected output',
    })
    expect(report.severity).toBe('medium')
    expect(report.verified).toBe(false)
  })

  it('handles date range filters', async () => {
    const r1 = await store.add(sampleInput({ title: 'Dated Report' }))

    const past = '2020-01-01T00:00:00.000Z'
    const future = '2099-01-01T00:00:00.000Z'

    const includeFrom = await store.search({ date_from: past })
    expect(includeFrom.total).toBeGreaterThanOrEqual(1)

    const excludeFrom = await store.search({ date_from: future })
    expect(excludeFrom.total).toBe(0)

    const excludeTo = await store.search({ date_to: past })
    expect(excludeTo.total).toBe(0)

    const both = await store.search({ date_from: past, date_to: future })
    expect(both.total).toBeGreaterThanOrEqual(1)
  })

  it('combines multiple filters', async () => {
    await store.add(sampleInput({
      title: 'Target',
      domain: 'contracts',
      severity: 'high',
      jurisdiction: 'US-CA',
      hallucination_type: 'fake_citation',
    }))
    await store.add(sampleInput({
      title: 'Wrong Domain',
      domain: 'litigation',
      severity: 'high',
    }))

    const result = await store.search({
      domain: 'contracts',
      severity: 'high',
    })
    expect(result.total).toBe(1)
    expect(result.results[0].title).toBe('Target')
  })
})
