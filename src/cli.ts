#!/usr/bin/env node

import { Command } from 'commander'
import { createInterface } from 'readline/promises'
import { RegistryStore } from './registry/index.js'
import { SqliteRegistryStore } from './registry/sqlite.js'
import { validateCreateReport, validateSearchFilters } from './validate/index.js'
import { HallucinationType, SeverityLevel } from './schema.js'
import { importReports } from './import/index.js'
import { seedRegistry } from './seed.js'

function getStore(): RegistryStore {
  const dbPath = process.env.DATABASE_PATH ?? './hallucase.db'
  return new SqliteRegistryStore(dbPath)
}

async function withStore<T>(fn: (store: RegistryStore) => Promise<T>): Promise<T> {
  const store = getStore()
  await store.initialize()
  try {
    return await fn(store)
  } finally {
    store.close()
  }
}

const program = new Command()

program
  .name('hallucase')
  .description('The Legal AI Hallucination Registry — track, reproduce, and prevent legal AI hallucinations')
  .version('0.1.0')

program
  .command('search')
  .description('Search the hallucination registry')
  .option('-q, --query <query>', 'Full-text search query')
  .option('-t, --type <type>', 'Filter by hallucination type')
  .option('-s, --severity <severity>', 'Filter by severity level')
  .option('-d, --domain <domain>', 'Filter by legal domain')
  .option('-j, --jurisdiction <jurisdiction>', 'Filter by jurisdiction')
  .option('-m, --model <model>', 'Filter by affected AI model')
  .option('--verified', 'Filter by verified status', undefined)
  .option('--page <page>', 'Page number', '1')
  .option('--page-size <size>', 'Results per page', '20')
  .action(async (options) => {
    await withStore(async (store) => {
      const filters = validateSearchFilters({
        q: options.query,
        hallucination_type: options.type,
        severity: options.severity,
        domain: options.domain,
        jurisdiction: options.jurisdiction,
        affected_model: options.model,
        verified: options.verified,
      })
      const page = parseInt(options.page, 10)
      const pageSize = parseInt(options.pageSize, 10)
      const result = await store.search(filters, page, pageSize)
      console.log(JSON.stringify(result, null, 2))
    })
  })

program
  .command('get')
  .description('Get a specific report by ID or HC-ID')
  .argument('<id>', 'Report UUID or HC-ID (e.g. HC-000001)')
  .action(async (id) => {
    await withStore(async (store) => {
      const report = (await store.get(id)) ?? (await store.getByHcId(id))
      if (!report) {
        console.error('Report not found')
        process.exit(1)
      }
      console.log(JSON.stringify(report, null, 2))
    })
  })

program
  .command('submit')
  .description('Submit a new hallucination report (interactive)')
  .option('--json <json>', 'Submit report as JSON string')
  .option('--file <path>', 'Submit report from JSON file')
  .action(async (options) => {
    if (options.json) {
      await withStore(async (store) => {
        let data
        try {
          data = JSON.parse(options.json)
        } catch {
          console.error('Error: Invalid JSON provided to --json option')
          process.exit(1)
        }
        const input = validateCreateReport(data)
        const report = await store.add(input)
        console.log(JSON.stringify(report, null, 2))
      })
      return
    }

    if (options.file) {
      const { readFileSync } = await import('fs')
      const content = readFileSync(options.file, 'utf-8')
      await withStore(async (store) => {
        const input = validateCreateReport(JSON.parse(content))
        const report = await store.add(input)
        console.log(JSON.stringify(report, null, 2))
      })
      return
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout })

    try {
      const title = await rl.question('Title: ')
      const description = await rl.question('Description: ')
      console.log('\nHallucination types:')
      HallucinationType.options.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
      const typeIdx = parseInt(await rl.question('Select type [1-9]: '), 10) - 1
      const hallucination_type = HallucinationType.options[typeIdx] ?? 'other'

      console.log('\nSeverity levels:')
      SeverityLevel.options.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
      const sevIdx = parseInt(await rl.question('Select severity [1-5]: '), 10) - 1
      const severity = SeverityLevel.options[sevIdx] ?? 'medium'

      const domain = await rl.question('Domain (e.g., contracts, litigation): ')
      const jurisdiction = await rl.question('Jurisdiction (e.g., US-CA) [optional]: ')
      const hallucinated_output = await rl.question('Hallucinated output: ')
      const expected_correct_output = await rl.question('Expected correct output: ')

      const input = validateCreateReport({
        title,
        description,
        hallucination_type,
        severity,
        domain: domain || 'unknown',
        jurisdiction: jurisdiction || undefined,
        hallucinated_output,
        expected_correct_output,
        date_occurred: undefined,
        reported_by: undefined,
        verified: false,
        affected_models: undefined,
      })

      await withStore(async (store) => {
        const report = await store.add(input)
        console.log(`\nReport created: ${report.hc_id} (${report.id})`)
      })
    } finally {
      rl.close()
    }
  })

program
  .command('stats')
  .description('Show registry statistics')
  .action(async () => {
    await withStore(async (store) => {
      const stats = await store.stats()
      console.log('HalluCase Registry Statistics')
      console.log('=============================')
      console.log(`Total reports: ${stats.total}`)
      console.log('\nBy type:')
      for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type}: ${count}`)
      }
      console.log('\nBy severity:')
      for (const [sev, count] of Object.entries(stats.bySeverity).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${sev}: ${count}`)
      }
    })
  })

program
  .command('import')
  .description('Import reports from external sources')
  .argument('<file>', 'Path to import file (CSV or JSON)')
  .action(async (file) => {
    await withStore(async (store) => {
      const result = await importReports(file, store)
      console.log(`Import complete:`)
      console.log(`  Imported: ${result.imported}`)
      console.log(`  Skipped: ${result.skipped}`)
      if (result.errors.length > 0) {
        console.log('  Errors:')
        for (const err of result.errors) {
          console.log(`    - ${err}`)
        }
      }
    })
  })

program
  .command('seed')
  .description('Populate database with real-world AI hallucination incidents')
  .action(async () => {
    await withStore(async (store) => {
      console.log('Seeding hallucase registry with real-world incidents...\n')
      await seedRegistry(store)
    })
  })

program.parse(process.argv)
