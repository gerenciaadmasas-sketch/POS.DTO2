import Swal from "sweetalert2";
import { supabase } from "../index";
const tabla="usuarios";
export async function MostrarUsuarios (p){
    const {data} = await supabase
    .from(tabla)
    .select()
    .eq("id_auth",p.id_auth)
    .maybeSingle();
    return data;
}
export async function InsertarAdmin(p){
   const {data,error} = await supabase.from(tabla).insert(p).select().maybeSingle();
   if(error){
           if (error.code === "23505") {
               return null;
           }
           Swal.fire({
               icon: "error",
               title: "Oops...",
               text: error.message,
           });
           return;
       }
   return data;
}
export async function ObtenerIdAuthSupabase() {
    const {data:{session}}=await supabase.auth.getSession();
    if(session!=null){
        const {user} = session;
        const idauth = user.id;
        return idauth;
    }
}