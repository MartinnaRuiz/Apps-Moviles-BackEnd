# Letterbox Backend Grupo 6

Este backedn es una API REST hecha con Node.js, Express y Prisma. Basicamente hace de intermediario con la API de TMDB y ademas maneja todo lo nuestro: usuarios, login, reseñas y favoritos

=======================

## Antes de arrancar

Necesitas tener:
	•	Node.js 18 o más nuevo
	•	npm
	•	Prisma CLI (usar npx prisma)

=======================

## Como levantar el proyecto

### 1. Instalar dependencias

npm install

### 2. Crear el .env

en la raiz del proyecto crea un archivo .env con esto:

DATABASE_URL="prisma+postgres://localhost:51213/?api_key=TU_API_KEY"
TMDB_API_KEY=TU_TMDB_API_KEY
PORT=3000

(Obviamente reemplaza TU_API_KEY y TU_TMDB_API_KEY por las claves reales
El .env con los valores correctos se entrega aparte)

### 3. Aplicar migraciones a la BD

npx prisma migrate deploy

### 4. Generar el cliente de Prisma

npx prisma generate

### 5. Cargar datos iniciales

curl -X POST http://localhost:3000/api/avatars/seed

Tambien Si querés crear un usuario de prueba:

curl -X POST http://localhost:3000/api/auth/seed

(crea este usuario:
	•	mail: prueba@test.com
	•	contraseña: prueba)

=======================

## Levantar el servidor

### Poner dev mode

npm run dev

### poner en produccion

npm run build
npm start

Por defecto corre en: http://localhost:3000 ((o el puerto que pongas en el .env)

=======================

## Endpoints principales
	•	POST /api/auth/register → registrar usuario
	•	POST /api/auth/login → login (devuelve JWT)
	•	PUT /api/auth/me → actualizar perfil (requiere token)
	•	GET /api/movies/popular → películas populares (desde TMDB)
	•	GET /api/movies/:id → detalle de una película
	•	GET /api/search?query= → buscar películas
	•	GET /api/reviews → ver reseñas
	•	POST /api/reviews → crear reseña (requiere token)
	•	GET /api/favorites → ver favoritos (requiere token)
	•	POST /api/favorites → agregar favorito (requiere token)
	•	DELETE /api/favorites/:movieId → eliminar favorito (requiere token)
	•	GET /api/avatars → listar avatares disponibles

=======================

## Tecnologias que usamos
	•	Express 5 → para levantar el servidor
	•	Prisma → para manejar la base de datos
	•	bcryptjs → para hashear contraseñas
	•	jsonwebtoken → para autenticación con JWT
	•	TMDB API → para traer datos de películas