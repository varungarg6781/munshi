import { NeonQueryFunction, neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

neonConfig.fetchConnectionCache = true;
if(!process.env.DATABASE_URL){
    throw new Error('Database connection not found')
}

const sql = neon(process.env.DATABASE_URL)

// Deviation
export const db = drizzle(sql as unknown as NeonQueryFunction<boolean, boolean>);
