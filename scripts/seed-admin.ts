// scripts/seed-admin.ts
// ─────────────────────────────────────────────────────────
// İlk admin hesabı yaratmaq üçün seed script.
// Yalnız development/staging üçün.
// Production-da Supabase Dashboard-dan manual işlət.
// ─────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local or .env
function loadEnv() {
  const envPaths = ['.env.local', '.env']
  for (const envFile of envPaths) {
    const fullPath = path.resolve(process.cwd(), envFile)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=')
          if (firstEqual !== -1) {
            const key = trimmed.substring(0, firstEqual).trim()
            let val = trimmed.substring(firstEqual + 1).trim()
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1)
            }
            if (!process.env[key]) {
              process.env[key] = val
            }
          }
        }
      }
    }
  }
}

loadEnv()

const supabaseUrl  = process.env.VITE_SUPABASE_URL!
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin üçün service role

if (!supabaseUrl || !serviceKey) {
  console.error('❌ VITE_SUPABASE_URL və SUPABASE_SERVICE_ROLE_KEY .env-də olmalıdır')
  process.exit(1)
}

// Service role client — RLS bypass edir (yalnız server-side!)
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q: string) => new Promise<string>(res => rl.question(q, res))

async function seedAdmin() {
  console.log('\n🔐 Flaro Admin Seed\n')

  const email    = await ask('Admin email: ')
  const password = await ask('Admin şifrəsi (min 12 simvol): ')
  const fullName = await ask('Ad Soyad: ')

  // Şifrə gücü yoxla
  if (password.length < 12) {
    console.error('❌ Şifrə minimum 12 simvol olmalıdır')
    process.exit(1)
  }

  // 1. Auth user yarat
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // Email təsdiqinə ehtiyac yoxdur
    user_metadata: { full_name: fullName, is_admin: true }
  })

  if (authError) {
    // User artıq mövcuddursa — sadəcə admin et
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      console.log('⚠️  Bu email artıq qeydiyyatdadır. Admin flag əlavə edilir...')
      
      const { data: existingUser, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) {
        console.error('❌ İstifadəçi siyahısı gətirilə bilmədi:', listError.message)
        process.exit(1)
      }

      const user = existingUser.users.find(u => u.email === email)
      
      if (!user) {
        console.error('❌ İstifadəçi tapılmadı')
        process.exit(1)
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true, full_name: fullName })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Profile yenilənmədi:', updateError.message)
        process.exit(1)
      }

      console.log(`✅ ${email} admin edildi!`)
    } else {
      console.error('❌ Auth xətası:', authError.message)
      process.exit(1)
    }
  } else {
    // 2. Profile-i is_admin=true ilə yenilə
    // (handle_new_user trigger artıq profile yaratdı, lakin trigger is_admin-i meta-datadan götürür.
    // Yenə də hər ehtimala qarşı manual update edirik)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('❌ Profile update xətası:', profileError.message)
      process.exit(1)
    }

    console.log(`\n✅ Admin hesab yaradıldı!`)
    console.log(`   Email:    ${email}`)
    console.log(`   Ad:       ${fullName}`)
    console.log(`   Login:    /admin/login\n`)
  }

  rl.close()
}

seedAdmin().catch(err => {
  console.error('Xəta:', err)
  process.exit(1)
})
