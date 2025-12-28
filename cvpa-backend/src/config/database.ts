import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cvpa',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased for Supabase pooler connections
});

export async function initializeDatabase() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection error:', error);
    throw error;
  }
}

