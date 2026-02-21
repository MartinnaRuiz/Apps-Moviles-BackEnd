import {Request,Response,Router} from 'express';
import {authenticateToken} from '../middleware/auth.middleware';
import {prisma} from '../lib/prisma';

interface AuthRequest extends Request{
  userId?:number;
}

const router=Router();
router.use(authenticateToken);

router.get('/',async(req:AuthRequest,res:Response)=>{
  try{
    const userId=req.userId;
    if(!userId) return res.status(401).json({message:'No autorizado'});
    const lists=await prisma.list.findMany({
      where:{userId},
      include:{_count:{select:{movies:true}}},
      orderBy:{createdAt:'desc'},
    });
    res.json(lists);
  }catch(error){
    res.status(500).json({message:'Error al obtener listas'});
  }
});

router.post('/',async(req:AuthRequest,res:Response)=>{
  try{
    const userId=req.userId;
    if(!userId) return res.status(401).json({message:'No autorizado'});
    const{name}=req.body;
    if(!name) return res.status(400).json({message:'El nombre es requerido'});
    const list=await prisma.list.create({data:{userId,name}});
    res.status(201).json(list);
  }catch(error){
    res.status(500).json({message:'Error al crear lista'});
  }
});

router.get('/:id',async(req:AuthRequest,res:Response)=>{
  try{
    const userId=req.userId;
    if(!userId) return res.status(401).json({message:'No autorizado'});
    const listId=Number(req.params.id);
    const list=await prisma.list.findFirst({
      where:{id:listId,userId},
      include:{movies:{orderBy:{addedAt:'desc'}}},
    });
    if(!list) return res.status(404).json({message:'Lista no encontrada'});
    res.json(list);
  }catch(error){
    res.status(500).json({message:'Error al obtener lista'});
  }
});

router.delete('/:id',async(req:AuthRequest,res:Response)=>{
  try{
    const userId=req.userId;
    if(!userId) return res.status(401).json({message:'No autorizado'});
    const listId=Number(req.params.id);
    const list=await prisma.list.findFirst({where:{id:listId,userId}});
    if(!list) return res.status(404).json({message:'Lista no encontrada'});
    await prisma.list.delete({where:{id:listId}});
    res.json({message:'Lista eliminada'});
  }catch(error){
    res.status(500).json({message:'Error al eliminar lista'});
  }
});

router.post('/:id/movies',async(req:AuthRequest,res:Response)=>{
  try{
    const userId=req.userId;
    if(!userId) return res.status(401).json({message:'No autorizado'});
    const listId=Number(req.params.id);
    const{movieId,title,posterPath}=req.body;
    if(!movieId||!title) return res.status(400).json({message:'movieId y title son requeridos'});
    const list=await prisma.list.findFirst({where:{id:listId,userId}});
    if(!list) return res.status(404).json({message:'Lista no encontrada'});
    const existing=await prisma.listMovie.findUnique({
      where:{listId_movieId:{listId,movieId:String(movieId)}},
    });
    if(existing) return res.status(400).json({message:'La película ya está en la lista'});
    const movie=await prisma.listMovie.create({
      data:{listId,movieId:String(movieId),title,posterPath:posterPath||null},
    });
    res.status(201).json(movie);
  }catch(error){
    res.status(500).json({message:'Error al agregar película a la lista'});
  }
});

router.delete('/:id/movies/:movieId',async(req:AuthRequest,res:Response)=>{
  try{
    const userId=req.userId;
    if(!userId) return res.status(401).json({message:'No autorizado'});
    const listId=Number(req.params.id);
    const{movieId}=req.params;
    const list=await prisma.list.findFirst({where:{id:listId,userId}});
    if(!list) return res.status(404).json({message:'Lista no encontrada'});
    await prisma.listMovie.deleteMany({where:{listId,movieId}});
    res.json({message:'Película eliminada de la lista'});
  }catch(error){
    res.status(500).json({message:'Error al eliminar película de la lista'});
  }
});

export default router;
