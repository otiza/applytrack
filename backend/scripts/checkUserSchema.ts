import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  console.log('Connected, checking columns for table "User"...');
  const cols: any = await prisma.$queryRaw`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='User';`;
  console.log('Columns:', cols);

  console.log('\nFetching users (including passwordHash if present)...');
  try{
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, passwordHash: true } });
    console.log('Users:', users);
  }catch(e:any){
    console.error('Error fetching users:', e.message);
  }

  await prisma.$disconnect();
}

main().catch(e=>{console.error(e);process.exit(1)});

