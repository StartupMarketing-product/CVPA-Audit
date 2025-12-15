import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { User } from '../types';

export class AuthService {
  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, passwordHash, name, 'user']
    );

    const user = result.rows[0];
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: this.generateToken(user),
    };
  }

  async login(email: string, password: string) {
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: this.generateToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateToken(user: User) {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

    return (jwt.sign as any)(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn }
    );
  }

  private generateRefreshToken(user: User) {
    const secret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    return (jwt.sign as any)(
      { id: user.id, email: user.email },
      secret,
      { expiresIn }
    );
  }
}

