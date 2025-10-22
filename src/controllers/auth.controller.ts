import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

const prisma = (globalThis as any).prisma || new PrismaClient();
if (!(globalThis as any).prisma) (globalThis as any).prisma = prisma;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthRequestBody {
  email?: string;
  password?: string;
  username?: string;
  name?: string;
}

export const register = async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  console.log('[auth] register start');
  try {
    const { email, password, username, name } = req.body;
    console.log('[auth] register body', { email: !!email, username: !!username });

    // Basic input validation
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, username y password son requeridos' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password debe tener al menos 6 caracteres' });
    }

    console.log('[auth] checking existing user...');
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email o username ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('[auth] creating user in DB...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name
        // no createdAt/updatedAt: Prisma schema tiene defaults
      }
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET as string, { expiresIn: '1d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, username: user.username, name: user.name }
    });
  } catch (error: any) {
    console.error('Error in register:', error.message || error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const login = async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  console.log('[auth] login start');
  try {
    const { email, password } = req.body;
    console.log('[auth] received body', { email: !!email, hasPassword: typeof password === 'string' });

    if (!email || !password) {
      console.log('[auth] missing credentials');
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    console.log('[auth] finding user in DB...');
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('[auth] findUnique returned', { userFound: !!user });

    if (!user) {
      console.log('[auth] user not found');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log('[auth] comparing password with bcrypt...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('[auth] bcrypt.compare result', { isPasswordValid });

    if (!isPasswordValid) {
      console.log('[auth] invalid password');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET as string, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, username: user.username, name: user.name }
    });
  } catch (error: any) {
    console.error('Error in login:', error.message || error);
    res.status(500).json({ message: 'Error during login' });
  }
};

// Nuevo: crear/asegurar usuario de prueba email: "prueba", password: "prueba"
export const seedPrueba = async (req: Request, res: Response) => {
  console.log('[auth] seedPrueba start');
  try {
    const email = 'prueba';
    const username = 'prueba';
    const plainPassword = 'prueba';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.json({ message: 'Test user already exists', user: { id: existing.id, email: existing.email, username: existing.username } });
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, name: 'Prueba' }
    });

    res.status(201).json({ message: 'Test user created', user: { id: user.id, email: user.email, username: user.username } });
  } catch (error: any) {
    console.error('Error creating test user:', error.message || error);
    res.status(500).json({ message: 'Error creating test user' });
  }
};

// Nuevo: health check simple (no DB) — opcional para comprobar que el servidor responde
export const health = (req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
};