const AppDataSource = require("../data-source");

async function createSessionTable() {
  try {
    await AppDataSource.initialize();

    console.log("Running session table migration...");

    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
    `);

    await AppDataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'session' AND constraint_name = 'session_pkey'
        ) THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END $$;
    `);

    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    console.log("✅ Session table migration completed successfully");
  } catch (error) {
    console.error("❌ Error running session table migration:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

createSessionTable();
