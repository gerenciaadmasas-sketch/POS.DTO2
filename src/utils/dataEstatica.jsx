import { v } from "../styles/variables";
import {
  AiOutlineHome,
  AiOutlineSetting,
} from "react-icons/ai";

export const DesplegableUser = [
  {
    text: "Mi perfil",
    icono: <v.iconoUser/>,
    tipo: "miperfil",
  },
  {
    text: "Configuracion",
    icono: <v.iconoSettings/>,
    tipo: "configuracion",
  },
  {
    text: "Cerrar sesión",
    icono: <v.iconoCerrarSesion/>,
    tipo: "cerrarsesion",
  },
];



//data SIDEBAR
export const LinksArray = [
  {
    label: "Home",
    icon: "solar:home-smile-bold-duotone",
    to: "/home",
  },
  {
    label: "Saas",
    icon: "solar:users-group-rounded-bold-duotone",
    to: "/saas",
  },
  {
    label: "Finanzas",
    icon: "solar:dollar-minimalistic-bold-duotone",
    to: "/finanzas",
    color: "#34d399",
  },
  {
    label: "Leads",
    icon: "solar:user-speak-bold-duotone",
    to: "/prospectos",
    color: "#818cf8",
  },
  {
    label: "Vender",
    icon: "solar:cart-large-2-bold-duotone",
    to: "/pos",
  },
  {
    label: "Inventario",
    icon: "solar:box-bold-duotone",
    to: "/inventario",
  },
  {
    label: "Kardex",
    icon: "solar:clipboard-list-bold-duotone",
    to: "/kardex",
  },
  {
    label: "Clientes",
    icon: "solar:chart-square-bold-duotone",
    to: "/reportes",
  },
  {
    label: "Arqueo",
    icon: "solar:wallet-money-bold-duotone",
    to: "/arqueo",
  },
  {
    label: "Mensajes Equipo",
    icon: "solar:chat-round-bold-duotone",
    to: "/mensajes",
    color: "#60a5fa",
  },
  {
    label: "Soporte",
    icon: "solar:headphones-round-bold-duotone",
    to: "/soporte",
    color: "#34d399",
  },
  {
    label: "Soporte",
    icon: "solar:headphones-round-bold-duotone",
    to: "/chat",
    color: "#f88533",
  },
];
export const SecondarylinksArray = [
  {
    label: "Configuración",
    icon: "solar:settings-bold-duotone",
    to: "/configuracion",
    color: "#a78bfa",
  },
];
//temas
export const TemasData = [
  {
    icono: "🌞",
    descripcion: "light",
   
  },
  {
    icono: "🌚",
    descripcion: "dark",
    
  },
];

//data configuracion
export const DataModulosConfiguracion =[
  {
    title:"Productos",
    subtitle:"registra tus productos",
    icono:"https://i.ibb.co/85zJ6yG/caja-del-paquete.png",
    link:"/configuracion/productos",
   
  },
  {
    title:"Personal",
    subtitle:"ten el control de tu personal",
    icono:"https://i.ibb.co/5vgZ0fX/hombre.png",
    link:"/configuracion/usuarios",
   
  },

  {
    title:"Tu empresa",
    subtitle:"configura tus opciones básicas",
    icono:"https://i.ibb.co/x7mHPgm/administracion-de-empresas.png",
    link:"/configuracion/empresa",
    
  },
  {
    title:"Categoria de productos",
    subtitle:"asigna categorias a tus productos",
    icono:"https://i.ibb.co/VYbMRLZ/categoria.png",
    link:"/configuracion/categorias",
    
  },
  {
    title:"Marca de productos",
    subtitle:"gestiona tus marcas",
    icono:"https://i.ibb.co/1qsbCRb/piensa-fuera-de-la-caja.png",
    link:"/configuracion/marca",
   
  },

]
//tipo usuario
export const TipouserData = [
  {
    descripcion: "empleado",
    icono: "🪖",
  },
  {
    descripcion: "administrador",
    icono: "👑",
  },
];
//tipodoc
export const TipoDocData = [
  {
    descripcion: "Dni",
    icono: "🪖",
  },
  {
    descripcion: "Libreta electoral",
    icono: "👑",
  },
  {
    descripcion: "Otros",
    icono: "👑",
  },
];
