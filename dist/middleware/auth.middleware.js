"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.id; // Asignar el id del payload a userId
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ message: 'Token inválido' });
    }
};
exports.authenticateToken = authenticateToken;
