import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function resetTables() {
  console.log('Resetting all tables...');
  
  // Disable FK constraints temporarily
  await db.execute(sql`SET session_replication_role = 'replica'`);
  
  // Truncate all tables
  await db.execute(sql`TRUNCATE TABLE session_events CASCADE`);
  await db.execute(sql`TRUNCATE TABLE replay_sessions CASCADE`);
  await db.execute(sql`TRUNCATE TABLE error_events CASCADE`);
  await db.execute(sql`TRUNCATE TABLE error_groups CASCADE`);
  await db.execute(sql`TRUNCATE TABLE api_keys CASCADE`);
  await db.execute(sql`TRUNCATE TABLE projects CASCADE`);
  await db.execute(sql`TRUNCATE TABLE organization_members CASCADE`);
  await db.execute(sql`TRUNCATE TABLE organizations CASCADE`);
  await db.execute(sql`TRUNCATE TABLE invitations CASCADE`);
  
  // Re-enable FK constraints
  await db.execute(sql`SET session_replication_role = 'origin'`);
  
  console.log('✅ All tables reset!');
  process.exit(0);
}

resetTables().catch(e => { console.error(e); process.exit(1); });
