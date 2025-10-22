import cors from 'cors';
import express from 'express';
import { prisma } from './lib/prisma';
import authRouter from './routes/auth.routes';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Cada quien cambia su IP local aquí
const LOCAL_IP = '192.168.1.33';
//caro: 192.168.0.121
//martu: 192.168.1.33
//maru: 192.168.0.187
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access from mobile: http://${LOCAL_IP}:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
