"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// GET /api/avatars  → lista de avatares activos
router.get('/', async (_req, res) => {
    const items = await prisma_1.prisma.profileImage.findMany({
        where: { isActive: true },
        select: { id: true, url: true, label: true },
        orderBy: { id: 'asc' },
    });
    res.json({ items });
});
router.post('/seed', async (_req, res) => {
    const files = [
        '/uploads/avatars/avatar1.jpeg',
        '/uploads/avatars/avatar2.jpeg',
        '/uploads/avatars/avatar3.jpeg',
    ];
    for (const [i, url] of files.entries()) {
        await prisma_1.prisma.profileImage.upsert({
            where: { url },
            create: { url, label: `Avatar ${i + 1}`, isActive: true },
            update: {},
        });
    }
    res.json({ ok: true, count: files.length });
});
// GET /api/avatars  → lista de avatares activos
router.get('/', async (_req, res) => {
    const items = await prisma_1.prisma.profileImage.findMany({
        where: { isActive: true },
        select: { id: true, url: true, label: true },
        orderBy: { id: 'asc' },
    });
    res.json({ items });
});
exports.default = router;
