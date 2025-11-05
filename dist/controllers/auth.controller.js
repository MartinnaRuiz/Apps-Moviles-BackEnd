"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = exports.updateMe = exports.seedPrueba = exports.login = exports.register = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { email, password, username, name } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ message: 'Email, username y password son requeridos' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password debe tener al menos 6 caracteres' });
        }
        const exists = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (exists)
            return res.status(400).json({ message: 'Email o username ya existe' });
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { email, password: hashed, username, name },
            include: { profileImage: { select: { id: true, url: true } } },
        });
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
        return res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                profileImageId: user.profileImageId ?? null,
                profileImage: user.profileImage ?? null, // { id, url } | null
            },
        });
    }
    catch (error) {
        console.error('Error in register:', error?.message || error);
        return res.status(500).json({ message: 'Error creating user' });
    }
};
exports.register = register;
/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y password son requeridos' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            include: { profileImage: { select: { id: true, url: true } } },
        });
        if (!user)
            return res.status(401).json({ message: 'Credenciales inválidas' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok)
            return res.status(401).json({ message: 'Credenciales inválidas' });
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                profileImageId: user.profileImageId ?? null,
                profileImage: user.profileImage ?? null,
            },
        });
    }
    catch (error) {
        console.error('Error in login:', error?.message || error);
        return res.status(500).json({ message: 'Error during login' });
    }
};
exports.login = login;
/**
 * POST /api/auth/seed  (usuario de prueba)
 */
const seedPrueba = async (_req, res) => {
    try {
        const email = 'prueba';
        const username = 'prueba';
        const plainPassword = 'prueba';
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.json({
                message: 'Test user already exists',
                user: { id: existing.id, email: existing.email, username: existing.username },
            });
        }
        const hashed = await bcrypt.hash(plainPassword, 10);
        const user = await prisma_1.prisma.user.create({
            data: { email, username, password: hashed, name: 'Prueba' },
        });
        return res.status(201).json({
            message: 'Test user created',
            user: { id: user.id, email: user.email, username: user.username },
        });
    }
    catch (error) {
        console.error('Error creating test user:', error?.message || error);
        return res.status(500).json({ message: 'Error creating test user' });
    }
};
exports.seedPrueba = seedPrueba;
/**
 * PUT /api/auth/me  (actualiza nombre y/o profileImageId)
 * Body: { name?: string, profileImageId?: number }
 * Requiere authRequired.
 */
const updateMe = async (req, res) => {
    try {
        const { name, profileImageId } = (req.body ?? {});
        const data = {};
        if (typeof name === 'string')
            data.name = name.trim();
        if (typeof profileImageId === 'number')
            data.profileImageId = profileImageId;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data,
            include: { profileImage: { select: { id: true, url: true } } },
        });
        return res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                profileImageId: user.profileImageId ?? null,
                profileImage: user.profileImage ?? null,
            },
        });
    }
    catch (e) {
        console.error('PUT /auth/me error', e);
        return res.status(500).json({ message: 'No se pudo actualizar el usuario' });
    }
};
exports.updateMe = updateMe;
/**
 * GET /api/auth/health
 */
const health = (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
};
exports.health = health;
