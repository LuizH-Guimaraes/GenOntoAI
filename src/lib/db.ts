import pkg from "pg";
const { Pool } = pkg;

declare global {
  var _pgPool: import("pg").Pool | null;
}

// Verifica se já existe um pool global (útil para ambientes como Firebase Functions ou Hot Reload)
if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  global._pgPool.on("error", (err) => {
    console.error("Erro inesperado no pool de conexões:", err);
    global._pgPool = null; // Invalida o pool para recriar depois
  });
}

export const pool = global._pgPool;
