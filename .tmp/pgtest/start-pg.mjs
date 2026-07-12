import EmbeddedPostgres from 'embedded-postgres';

const PG = EmbeddedPostgres.default || EmbeddedPostgres;

const pg = new PG({
  databaseDir: 'D:/code/learning-platform/.tmp/pgdata',
  port: 5432,
  user: 'hawza',
  password: 'hawza',
  database: 'hawza',
});

try {
  console.log('Initialising PostgreSQL...');
  await pg.initialise();
  console.log('Starting PostgreSQL...');
  await pg.start();
  console.log('PostgreSQL is running on port 5432');
  console.log('Press Ctrl+C to stop');
  
  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
  
  setInterval(() => {}, 1000);
} catch (err) {
  console.error('Failed:', err);
  process.exit(1);
}
