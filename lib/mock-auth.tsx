"use client";
// Context client ini hanya menyimpan tampilan user. Cookie httpOnly dan verifikasi identitas dikelola server.
import React,{createContext,useContext,useEffect,useState} from "react";
import type {User,UserRole} from "./types";
type AuthContextType={user:User|null;isLoading:boolean;login:(email:string,pass:string)=>Promise<{success:boolean;message?:string}>;logout:()=>void;switchRole:(role:UserRole)=>void;isAuthenticated:boolean};
const AuthContext=createContext<AuthContextType|undefined>(undefined);
function mapUser(raw:any):User|null { if(!raw) return null; return {id:raw.id,name:raw.name,email:raw.email,role:raw.role,clientId:raw.clientId??undefined,employeeId:raw.pegawaiId??undefined}; }
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [isLoading,setLoading]=useState(true);
 useEffect(()=>{fetch("/api/auth/session",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>setUser(mapUser(d?.user))).catch(()=>setUser(null)).finally(()=>setLoading(false));},[]);
 const login=async(email:string,pass:string)=>{try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password:pass})});const d=await r.json();if(!r.ok)return {success:false,message:d.message||"Login gagal."};setUser(mapUser(d.user));return {success:true};}catch{return {success:false,message:"Server tidak dapat dihubungi."};}};
 const logout=()=>{void fetch("/api/auth/logout",{method:"POST"}).finally(()=>{setUser(null);window.location.assign("/login");});};
 // Pergantian role lewat browser sengaja dinonaktifkan; role hanya berasal dari session server.
 const switchRole=(_role:UserRole)=>{};
 return <AuthContext.Provider value={{user,isLoading,login,logout,switchRole,isAuthenticated:!!user}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth harus digunakan di dalam AuthProvider");return value;}
