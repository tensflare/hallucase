import { Router, Request, Response } from 'express'
import { RegistryStore } from '../registry/index.js'
import { validateCreateReport, validateSearchFilters, validatePartialReport, ValidationError } from '../validate/index.js'
import { HallucinationReport } from '../schema.js'

export function createRouter(store: RegistryStore): Router {
  const router = Router()

  router.use((_req, res, next) => {
    res.setHeader('X-HalluCase-Version', '0.1.0')
    next()
  })

  router.get('/reports', async (req: Request, res: Response) => {
    try {
      const filters = validateSearchFilters(req.query)
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size as string) || 20))
      const result = await store.search(filters, page, pageSize)
      res.json(result)
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message, issues: err.issues })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  })

  router.get('/reports/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const report = await store.get(id) ?? await store.getByHcId(id)
      if (!report) {
        res.status(404).json({ error: 'Report not found' })
        return
      }
      res.json(report)
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/reports', async (req: Request, res: Response) => {
    try {
      const input = validateCreateReport(req.body)
      const report = await store.add(input)
      res.status(201).json(report)
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message, issues: err.issues })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  })

  router.put('/reports/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const input = validatePartialReport(req.body)
      const report = await store.update(id, input)
      if (!report) {
        res.status(404).json({ error: 'Report not found' })
        return
      }
      res.json(report)
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message, issues: err.issues })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  })

  router.delete('/reports/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const removed = await store.remove(id)
      if (!removed) {
        res.status(404).json({ error: 'Report not found' })
        return
      }
      res.status(204).send()
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await store.stats()
      res.json(stats)
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/schema', (_req: Request, res: Response) => {
    res.json({
      version: '0.1.0',
      report_format: {
        id: 'string (uuid)',
        hc_id: 'string (HC-XXXXXX)',
        title: 'string (5-200 chars)',
        description: 'string (min 20 chars)',
        hallucination_type: 'enum',
        severity: 'enum',
        domain: 'string',
        jurisdiction: 'string?',
        date_documented: 'ISO datetime',
        date_occurred: 'ISO datetime?',
        hallucinated_output: 'string',
        expected_correct_output: 'string',
        reproduction_prompt: 'string?',
        reproduction_steps: 'string[]?',
        affected_models: 'AffectedModel[]?',
        source_document_type: 'string?',
        source_description: 'string?',
        impact_description: 'string?',
        sanctions_or_outcome: 'string?',
        prevention_playbook: 'string?',
        detection_tips: 'string[]?',
        related_hc_ids: 'string[]?',
        reported_by: 'string?',
        verified: 'boolean',
        references: 'string(url)[]?',
        created_at: 'ISO datetime',
        updated_at: 'ISO datetime',
      },
      hallucination_types: [
        'fake_citation', 'misquoted_statute', 'fabricated_contract_clause',
        'incorrect_legal_standard', 'fabricated_obligation', 'misstated_jurisdiction_law',
        'incorrect_procedural_rule', 'hallucinated_precedent', 'other',
      ],
      severity_levels: ['critical', 'high', 'medium', 'low', 'info'],
    })
  })

  return router
}
