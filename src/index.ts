import cors from 'cors';
import path from 'path';
import express from 'express';
import { prisma } from './lib/prisma';
import reviewRouter from './routes/review.routes';
import authRouter from './routes/auth.routes';
import avatarRouter from './routes/avatar.routes';
import favoritesRouter from './routes/favorites.routes';
import listsRouter from './routes/lists.routes';
import 'dotenv/config';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

import { LOCAL_IP } from './config';

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/avatars', avatarRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/lists', listsRouter);

app.get('/', (_req, res) => {
  res.json({ message: 'API is working!' });
});

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

app.get('/api/movies/upcoming', async (_req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/upcoming');
    res.json(data);
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    res.status(500).json({
      error: 'Error al obtener próximos estrenos',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/movies/toprated', async (_req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/top_rated');
    res.json(data);
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    res.status(500).json({
      error: 'Error al obtener películas mejor valoradas',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/movies/genre/comedy', async (_req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('TMDB_API_KEY no configurada');
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=es-ES&with_genres=35&sort_by=popularity.desc`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching comedy movies:', error);
    res.status(500).json({
      error: 'Error al obtener comedias',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/movies/genre/drama', async (_req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('TMDB_API_KEY no configurada');
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=es-ES&with_genres=18&sort_by=popularity.desc`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching drama movies:', error);
    res.status(500).json({
      error: 'Error al obtener dramas',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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

app.get('/api/users/:id', async (req, res) => {
  try {
    const {id}=req.params;
    const user=await prisma.user.findUnique({
      where:{id:Number(id)},
      select:{
        id:true,
        name:true,
        username:true,
        profileImage:true,
        _count:{select:{reviews:true,favorites:true}},
      },
    });
    if(!user) return res.status(404).json({error:'Usuario no encontrado'});
    res.json(user);
  } catch(error){
    res.status(500).json({error:'Error al obtener usuario'});
  }
});

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(` Server is running on port ${PORT}`);
      console.log(` Access from mobile: http://${LOCAL_IP}:${PORT}`);
      console.log(` Available endpoints:`);
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
