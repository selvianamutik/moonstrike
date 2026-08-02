import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  
  if (admin.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only super admins can run storage migration.' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun === true
    const category = body.category || 'all'

    // Validate category
    const validCategories = ['games', 'services', 'hero-banners', 'custom-pages', 'payment-icons', 'assets', 'all']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Build command
    const args = ['tsx', 'scripts/migrate-to-r2.ts']
    if (dryRun) args.push('--dry-run')
    args.push(`--category=${category}`)

    const command = args.join(' ')

    // Execute migration script
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes timeout
    })

    return NextResponse.json({
      success: true,
      dryRun,
      category,
      output: stdout,
      errors: stderr || null,
    })
  } catch (error) {
    console.error('Migration error:', error)
    
    if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
      const execError = error as { stdout: string; stderr: string; message: string }
      return NextResponse.json(
        {
          error: 'Migration script failed',
          message: execError.message,
          output: execError.stdout,
          errors: execError.stderr,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Migration failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const admin = await getAdminSession()
  
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Return migration status/info
  return NextResponse.json({
    available: true,
    categories: ['games', 'services', 'hero-banners', 'custom-pages', 'payment-icons', 'assets', 'all'],
    instructions: 'POST to this endpoint with { category: string, dryRun: boolean }',
  })
}
