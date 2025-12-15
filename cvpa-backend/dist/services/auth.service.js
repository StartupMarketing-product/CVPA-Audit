"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
class AuthService {
    async register(email, password, name) {
        // Check if user already exists
        const existingUser = await database_1.pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            throw new Error('User already exists');
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const result = await database_1.pool.query('INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at', [email, passwordHash, name, 'user']);
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
    async login(email, password) {
        // Find user
        const result = await database_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            throw new Error('Invalid credentials');
        }
        const user = result.rows[0];
        // Verify password
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
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
    generateToken(user) {
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
        return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn });
    }
    generateRefreshToken(user) {
        const secret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
        const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
        return jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, secret, { expiresIn });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map