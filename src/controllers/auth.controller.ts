import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthedRequest } from '../middlewares/authRequired';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthRequestBody {
  email?: string;
  password?: string;
  username?: string;
  name?: string;
}

export const register = async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  try {
    const { email, password, username, name } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, username y password son requeridos' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password debe tener al menos 6 caracteres' });
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) return res.status(400).json({ message: 'Email o username ya existe' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, username, name },
      include: { profileImage: { select: { id: true, url: true } } },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET as string, { expiresIn: '1d' });

    return res.status(201).json({
      message: 'User created successfully',
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
  } catch (error: any) {
    console.error('Error in register:', error?.message || error);
    return res.status(500).json({ message: 'Error creating user' });
  }
};

export const login = async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profileImage: { select: { id: true, url: true } } },
    });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET as string, { expiresIn: '1d' });

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
  } catch (error: any) {
    console.error('Error in login:', error?.message || error);
    return res.status(500).json({ message: 'Error during login' });
  }
};

export const seedPrueba = async (_req: Request, res: Response) => {
  try {
    const email = 'prueba';
    const username = 'prueba';
    const plainPassword = 'prueba';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.json({
        message: 'Test user already exists',
        user: { id: existing.id, email: existing.email, username: existing.username },
      });
    }

    const hashed = await bcrypt.hash(plainPassword, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashed, name: 'Prueba' },
    });

    return res.status(201).json({
      message: 'Test user created',
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error: any) {
    console.error('Error creating test user:', error?.message || error);
    return res.status(500).json({ message: 'Error creating test user' });
  }
};

export const updateMe = async (req: AuthedRequest, res: Response) => {
  try {
    const { name, profileImageId } = (req.body ?? {}) as {
      name?: string;
      profileImageId?: number;
    };

    const data: any = {};
    if (typeof name === 'string') data.name = name.trim();
    if (typeof profileImageId === 'number') data.profileImageId = profileImageId;

    const user = await prisma.user.update({
      where: { id: req.userId! },
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
  } catch (e) {
    console.error('PUT /auth/me error', e);
    return res.status(500).json({ message: 'No se pudo actualizar el usuario' });
  }
};

export const health = (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
};
