import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL\s*=\s*"([^"]+)"/);
if (!match) {
  console.error('❌ DATABASE_URL topilmadi');
  process.exit(1);
}
const databaseUrl = match[1];

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

console.log('\n📋 public schema jadvallari:\n');
const tables = await client.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
);
for (const row of tables.rows) {
  console.log(`  - ${row.table_name}`);
}

console.log('\n📊 Qatorlar soni:\n');
for (const row of tables.rows) {
  const tableName = row.table_name;
  try {
    const count = await client.query(`SELECT COUNT(*)::int AS n FROM "${tableName}"`);
    console.log(`  ${tableName}: ${count.rows[0].n}`);
  } catch (err) {
    console.log(`  ${tableName}: ❌ ${err.message}`);
  }
}

console.log('\n🔍 Legacy iam_* jadvallari:\n');
const legacy = await client.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'iam_%' ORDER BY table_name`
);
if (legacy.rows.length === 0) {
  console.log("  (yo'q)");
} else {
  for (const row of legacy.rows) {
    console.log(`  - ${row.table_name}`);
  }
}

await client.end();
console.log('\n✅ Tekshiruv tugadi.\n');