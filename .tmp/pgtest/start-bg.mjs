/**
 * Start the embedded PostgreSQL instance (no admin required).
 *
 * The data dir is already initialised — we only call `start()`.
 * If you ever need to re-initialise, delete `.tmp/pgdata` and set
 * REINIT=1 in the env.
 */
import EmbeddedPostgres from 'embedded-postgres';

const PG = EmbeddedPostgres.default || EmbeddedPostgres;
const dataDir = 'D:/code/learning-platform/.tmp/pgdata';
const port = 5432;

const pg = new PG({
  databaseDir: dataDir,
  port,
  user: 'hawza',
  password: 'hawza',
  database: 'hawza',
});

async function main() {
  if (process.env.REINIT === '1') {
    console.log('[reinit] initialising fresh data dir at', dataDir);
    await pg.initialise();
  }

  console.log('Starting PostgreSQL on port', port, '…');
  await pg.start();
  console.log('PostgreSQL is up. Press Ctrl+C to stop.');

  const stop = async () => {
    console.log('\nStopping PostgreSQL…');
    try { await pg.stop(); } catch (e) { console.error('stop error', e); }
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  // Keep alive
  setInterval(() => {}, 60_000);
}

main().catch((err) => {
  console.error('Failed to start PostgreSQL:', err);
  process.exit(1);
});
