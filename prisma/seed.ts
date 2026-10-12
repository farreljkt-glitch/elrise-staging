import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma=new PrismaClient();
async function main(){
 const email=process.env.SEED_SUPERADMIN_EMAIL?.trim().toLowerCase(); const password=process.env.SEED_SUPERADMIN_PASSWORD;
 if(!email||!password||password.length<16) throw new Error("Isi SEED_SUPERADMIN_EMAIL dan SEED_SUPERADMIN_PASSWORD minimal 16 karakter di environment sebelum seed.");
 const existing=await prisma.user.findUnique({where:{email}});
 if(existing){console.log("Superadmin sudah ada; seed tidak mengubah password atau role.");return;}
 await prisma.user.create({data:{email,name:"Superadmin Elkyno",passwordHash:await bcrypt.hash(password,12),role:Role.SUPERADMIN,isActive:true,mustChangePassword:true}});
 console.log("Superadmin berhasil dibuat. Hapus SEED_SUPERADMIN_PASSWORD dari environment dan ganti password saat login pertama.");
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
