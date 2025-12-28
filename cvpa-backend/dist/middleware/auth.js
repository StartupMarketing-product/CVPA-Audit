"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    // #region agent log
    console.log(`[DEBUG] Auth middleware: path=${req.path}, hasToken=${!!token}, method=${req.method}`);
    // #endregion
    if (!token) {
        // #region agent log
        console.log(`[DEBUG] Auth failed: No token for path=${req.path}`);
        // #endregion
        return res.status(401).json({ error: 'Access token required' });
    }
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
        if (err) {
            // #region agent log
            console.log(`[DEBUG] Auth failed: Invalid token for path=${req.path}, error=${err.message}`);
            // #endregion
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        // #region agent log
        console.log(`[DEBUG] Auth success: user=${req.user.id}, path=${req.path}`);
        // #endregion
        next();
    });
}
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map