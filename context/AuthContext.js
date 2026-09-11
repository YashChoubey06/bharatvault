"use client";
import {createContext,useContext,useEffect,useState} from "react";
import {login as apiLogin,logout as apiLogout,getCurrentUser} from "@/services/api/auth";
const AuthContext=createContext(null);
export function AuthProvider({children}) {
 const [user,setUser]=useState(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{getCurrentUser().then(setUser).catch(()=>setUser(null)).finally(()=>setLoading(false));},[]);
 async function login(email,password) {setLoading(true);try{const result=await apiLogin(email,password);setUser(result.user);return result;}finally{setLoading(false);}}
 async function logout(){await apiLogout();setUser(null);}
 return <AuthContext.Provider value={{user,loading,isAuthenticated:Boolean(user),login,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("AuthProvider is required");return value;}
