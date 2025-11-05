import cors from 'cors';
import path from 'path';
import express from 'express';
import { prisma } from './lib/prisma';
import reviewRouter from './routes/review.routes';
import authRouter from './routes/auth.routes';
import avatarRouter from './routes/avatar.routes';
import favoritesRouter from './routes/favorites.routes';
import 'dotenv/config';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const LOCAL_IP = '192.168.0.121';

// Middleware
app.use(cors());
app.use(express.json());

// Archivos estáticos (sirve /uploads/avatars/..)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rutas API
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/avatars', avatarRouter);
app.use('/api/favorites', favoritesRouter);

// Ruta de prueba
app.get('/', (_req, res) => {
  res.json({ message: 'API is working!' });
});

// 🎬 Función auxiliar para hacer fetch a TMDB
const fetchFromTMDB = async (endpoint: string) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY no configurada');
  }
  const url = `https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&language=es-ES`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
};

// 🎬 Películas populares
app.get('/api/movies/popular', async (_req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/popular');
    res.json(data);
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({
      error: 'Error al obtener películas populares',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 🎬 Detalles de una película
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({
      error: 'Error al obtener detalles de la película',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 🎬 Elenco de una película
app.get('/api/movies/:id/credits', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}/credits`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching movie credits:', error);
    res.status(500).json({
      error: 'Error al obtener el elenco',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 🎬 Películas similares
app.get('/api/movies/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}/similar`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    res.status(500).json({
      error: 'Error al obtener películas similares',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 🎬 Proveedores de streaming (Dónde ver)
app.get('/api/movies/:id/watch/providers', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}/watch/providers`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    res.status(500).json({
      error: 'Error al obtener proveedores de streaming',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 🎬 Videos (Trailers)
app.get('/api/movies/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}/videos`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      error: 'Error al obtener videos',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 🔍 Búsqueda de películas (con paginación)
app.get('/api/search', async (req, res) => {
  try {
    const { query, page = '1' } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter requerido' });

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('TMDB_API_KEY no configurada');

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(
      String(query),
    )}&page=${page}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);

    const data = await response.json();
    res.json({
      results: data.results || [],
      total_results: data.total_results,
      total_pages: data.total_pages,
      page: data.page,
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({
      error: 'Error al buscar películas',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 Access from mobile: http://${LOCAL_IP}:${PORT}`);
      console.log(`🎬 Available endpoints:`);
      console.log(`   - GET /api/movies/popular`);
      console.log(`   - GET /api/movies/:id`);
      console.log(`   - GET /api/movies/:id/credits`);
      console.log(`   - GET /api/movies/:id/similar`);
      console.log(`   - GET /api/movies/:id/watch/providers`);
      console.log(`   - GET /api/movies/:id/videos`);
      console.log(`   - GET /api/search?query=...`);
      console.log(`   - GET /api/avatars`);
      console.log(`   - GET /api/favorites`);
      console.log(`   - POST /api/favorites`);
      console.log(`   - DELETE /api/favorites/:movieId`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
