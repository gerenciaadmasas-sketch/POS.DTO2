import { useState, useEffect, useRef, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { v } from "../../styles/variables";
import { useQuery } from "@tanstack/react-query";
import { MostrarConfigPlanes } from "../../supabase/crudConfigPlanes";
import { useAuthStore } from "../../store/AuthStore";
import { ObtenerEmailPorUsuario } from "../../supabase/crudUsuarios";
import { CrearProspecto } from "../../supabase/crudProspectos";
import { supabase } from "../../supabase/supabase.config";
import ConfettiExplosion from "react-confetti-explosion";
import {
    RiArrowLeftSLine, RiCheckLine, RiCloseLine,
    RiFlashlightLine, RiFireLine, RiPlanetLine,
    RiShieldCheckLine, RiCustomerService2Line,
    RiRocketLine, RiWhatsappLine, RiStore2Line,
    RiTeamLine, RiBarChartBoxLine, RiFileListLine,
    RiArchiveLine, RiPrinterLine, RiStarLine,
    RiSmartphoneLine, RiInfinityLine, RiVipCrownLine,
    RiTimeLine, RiGroupLine, RiEyeLine, RiEyeOffLine,
    RiPhoneLine, RiLockLine, RiCheckboxCircleFill,
    RiShieldLine, RiMailLine, RiArrowDownSLine, RiStoreLine,
} from "react-icons/ri";

const ACTIVIDADES = [
    { key: "retail_ropa",   label: "Retail — Ropa y accesorios",   emoji: "👗" },
    { key: "restaurante",   label: "Restaurante",                   emoji: "🍽️" },
    { key: "cafeteria",     label: "Cafetería",                     emoji: "☕" },
    { key: "tienda",        label: "Tienda / Minimarket",           emoji: "🛒" },
    { key: "farmacia",      label: "Farmacia / Droguería",          emoji: "💊" },
    { key: "ferreteria",    label: "Ferretería",                    emoji: "🔧" },
    { key: "salon_belleza", label: "Salón de belleza",              emoji: "💇" },
    { key: "veterinaria",   label: "Veterinaria",                   emoji: "🐾" },
    { key: "construccion",  label: "Construcción / Inmobiliaria",   emoji: "🏗️" },
];

/* ─────────────────────────────────────────
   DATOS DE LOS PLANES
───────────────────────────────────────── */
const PLANES = [
    {
        id: "chispa",
        nombre: "Chispa",
        emoji: "⚡",
        icon: <RiFlashlightLine />,
        tagline: "El arranque perfecto",
        sub: "Para tu primera tienda — simple, rápido y sin complicaciones.",
        badge: "Ideal para comenzar",
        precio_mes: 49000,
        precio_ano: 42000,
        color: "#818cf8",
        colorAlt: "#6366f1",
        colorDark: "#4338ca",
        glow: "rgba(99,102,241,0.4)",
        popular: false,
        features: [
            { icon: <RiStore2Line />,       ok: true,  txt: "1 almacén" },
            { icon: <RiTeamLine />,         ok: true,  txt: "Hasta 2 usuarios" },
            { icon: <RiFlashlightLine />,   ok: true,  txt: "Punto de venta (POS)" },
            { icon: <RiArchiveLine />,      ok: true,  txt: "Inventario básico" },
            { icon: <RiBarChartBoxLine />,  ok: true,  txt: "Reportes básicos" },
            { icon: <RiWhatsappLine />,     ok: true,  txt: "Soporte por WhatsApp" },
            { icon: <RiFileListLine />,     ok: false, txt: "Kardex y trazabilidad" },
            { icon: <RiGroupLine />,        ok: false, txt: "Multi-sucursal" },
        ],
    },
    {
        id: "fuego",
        nombre: "Fuego",
        emoji: "🔥",
        icon: <RiFireLine />,
        tagline: "El combustible de tu crecimiento",
        sub: "Para negocios que ya saben lo que quieren y van por más.",
        badge: "⭐ El más elegido",
        precio_mes: 129000,
        precio_ano: 110000,
        color: "#f88533",
        colorAlt: "#f56a00",
        colorDark: "#b45309",
        glow: "rgba(248,133,51,0.5)",
        popular: true,
        features: [
            { icon: <RiStore2Line />,       ok: true,  txt: "Hasta 3 almacenes" },
            { icon: <RiTeamLine />,         ok: true,  txt: "Hasta 10 usuarios" },
            { icon: <RiFlashlightLine />,   ok: true,  txt: "POS con roles completos" },
            { icon: <RiArchiveLine />,      ok: true,  txt: "Inventario avanzado" },
            { icon: <RiFileListLine />,     ok: true,  txt: "Kardex y trazabilidad" },
            { icon: <RiBarChartBoxLine />,  ok: true,  txt: "Reportes en tiempo real" },
            { icon: <RiGroupLine />,        ok: true,  txt: "Multi-sucursal" },
            { icon: <RiPrinterLine />,      ok: true,  txt: "Ticket personalizado" },
            { icon: <RiShieldCheckLine />,  ok: true,  txt: "Soporte prioritario" },
        ],
    },
    {
        id: "cosmos",
        nombre: "Cosmos",
        emoji: "🌌",
        icon: <RiPlanetLine />,
        tagline: "Sin límites. Sin fronteras.",
        sub: "Para cadenas y operaciones que piensan en grande — muy en grande.",
        badge: "Potencia ilimitada",
        precio_mes: 249000,
        precio_ano: 212000,
        color: "#34d399",
        colorAlt: "#10b981",
        colorDark: "#065f46",
        glow: "rgba(52,211,153,0.4)",
        popular: false,
        features: [
            { icon: <RiInfinityLine />,             ok: true, txt: "Almacenes ilimitados" },
            { icon: <RiInfinityLine />,             ok: true, txt: "Usuarios ilimitados" },
            { icon: <RiFlashlightLine />,           ok: true, txt: "Todo del plan Fuego" },
            { icon: <RiSmartphoneLine />,           ok: true, txt: "App móvil optimizada" },
            { icon: <RiVipCrownLine />,             ok: true, txt: "Onboarding personalizado" },
            { icon: <RiCustomerService2Line />,     ok: true, txt: "Soporte dedicado 24/7" },
            { icon: <RiShieldCheckLine />,          ok: true, txt: "SLA garantizado 99.9%" },
            { icon: <RiTimeLine />,                 ok: true, txt: "Respuesta en < 2 horas" },
        ],
    },
];

const PROCESS_MSGS = [
    "Validando tu información...",
    "Conectando de forma segura...",
    "Preparando tu panel de control...",
];

const STATS = [
    { val: "200+", label: "negocios activos" },
    { val: "99.9%", label: "uptime garantizado" },
    { val: "< 2min", label: "tiempo de activación" },
    { val: "5★", label: "calificación promedio" },
];

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

/* ─────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────── */
export function PlanesTemplate() {
    const navigate = useNavigate();
    const { loginEmail } = useAuthStore();

    // Features desde DB (superadmin puede editarlas en /configuracion/planes)
    const { data: configPlanes = [] } = useQuery({
        queryKey: ["config-planes"],
        queryFn: MostrarConfigPlanes,
        staleTime: 5 * 60 * 1000,
    });

    const planFeatures = useMemo(() => {
        const result = {};
        PLANES.forEach(plan => {
            const dbPlan = configPlanes.find(p => p.tier === plan.id);
            if (dbPlan?.features?.length) {
                // Mapa de iconos locales por texto
                const iconMap = {};
                plan.features.forEach(f => { iconMap[f.txt] = f.icon; });
                result[plan.id] = dbPlan.features.map(f => ({
                    icon: iconMap[f.label] ?? null,
                    ok:   f.activo,
                    txt:  f.label,
                }));
            } else {
                result[plan.id] = plan.features;
            }
        });
        return result;
    }, [configPlanes]);

    const [anual, setAnual] = useState(false);
    const [visible, setVisible] = useState(false);
    const heroRef = useRef(null);

    /* ── Estado del modal de registro ── */
    const [registroOpen, setRegistroOpen] = useState(false);
    const [regForm, setRegForm]           = useState({ nombre: "", apellido: "", telefono: "", contacto_preferido: "whatsapp", negocio: "" });
    const [regCargando, setRegCargando]   = useState(false);
    const [regOk, setRegOk]               = useState(false);
    const [regError, setRegError]         = useState("");

    /* ── Estado de pasarela de pago ── */
    const [pagoOpen, setPagoOpen]       = useState(false);
    const [planPago, setPlanPago]       = useState(null);
    const [pasoPago, setPasoPago]       = useState("datos"); // datos | procesando
    const [pagoForm, setPagoForm]       = useState({ nombre: "", apellido: "", cedula: "", email: "", empresa: "", telefono: "", actividad_economica: "" });
    const [pagoMsgIdx, setPagoMsgIdx]   = useState(0);
    const [pagoError, setPagoError]     = useState("");
    const [dropActPago, setDropActPago] = useState(false);
    const dropActPagoRef                = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropActPagoRef.current && !dropActPagoRef.current.contains(e.target))
                setDropActPago(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const abrirRegistro  = () => { setRegistroOpen(true); setRegOk(false); setRegError(""); setRegForm({ nombre: "", apellido: "", telefono: "", contacto_preferido: "whatsapp", negocio: "" }); };
    const cerrarRegistro = () => { setRegistroOpen(false); setRegOk(false); };

    const abrirPago = (plan) => {
        setPlanPago(plan);
        setPasoPago("datos");
        setPagoForm({ nombre: "", apellido: "", cedula: "", email: "", empresa: "", telefono: "", actividad_economica: "" });
        setPagoMsgIdx(0);
        setPagoError("");
        setDropActPago(false);
        setPagoOpen(true);
    };
    const cerrarPago = () => { setPagoOpen(false); setPagoError(""); };
    const handlePago = async (e) => {
        e.preventDefault();
        setPasoPago("procesando");
        setPagoMsgIdx(0);
        setPagoError("");

        try {
            // Llamar Edge Function wompi-sign para obtener hash + URL de checkout
            const { data, error } = await supabase.functions.invoke("wompi-sign", {
                body: {
                    plan:                planPago.id,
                    billing:             anual ? "anual" : "mensual",
                    nombre:              pagoForm.nombre,
                    apellido:            pagoForm.apellido,
                    email:               pagoForm.email,
                    empresa:             pagoForm.empresa,
                    telefono:            pagoForm.telefono,
                    cedula:              pagoForm.cedula,
                    actividad_economica: pagoForm.actividad_economica,
                },
            });
            if (error) throw error;
            // Redirigir al checkout de Wompi
            window.location.href = data.checkoutUrl;
        } catch (err) {
            console.error("[Wompi]", err);
            setPasoPago("datos");
            setPagoError("No pudimos conectar con la pasarela de pago. Intenta de nuevo.");
        }
    };

    const handleRegistro = async (e) => {
        e.preventDefault();
        setRegCargando(true); setRegError("");
        try {
            await CrearProspecto(regForm);
            setRegOk(true);
        } catch {
            setRegError("Ocurrió un error. Por favor intenta de nuevo.");
        } finally {
            setRegCargando(false);
        }
    };

    /* ── Estado del modal de login ── */
    const [loginOpen, setLoginOpen] = useState(false);
    const [usuario, setUsuario]     = useState("");
    const [password, setPassword]   = useState("");
    const [showPass, setShowPass]   = useState(false);
    const [cargando, setCargando]   = useState(false);
    const [errorMsg, setErrorMsg]   = useState("");

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") cerrarLogin(); };
        if (loginOpen) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [loginOpen]);

    useEffect(() => {
        document.body.style.overflow = (loginOpen || registroOpen || pagoOpen) ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [loginOpen, registroOpen, pagoOpen]);

    /* ciclar mensajes del procesador */
    useEffect(() => {
        if (pasoPago !== "procesando") { setPagoMsgIdx(0); return; }
        const t = setInterval(() => setPagoMsgIdx(i => (i >= PROCESS_MSGS.length - 1 ? i : i + 1)), 1060);
        return () => clearInterval(t);
    }, [pasoPago]);

    const abrirLogin = () => {
        setLoginOpen(true);
        setUsuario(""); setPassword(""); setErrorMsg(""); setShowPass(false);
    };

    const cerrarLogin = () => {
        setLoginOpen(false);
        setUsuario(""); setPassword(""); setErrorMsg("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!usuario || !password) return;
        setCargando(true);
        setErrorMsg("");
        try {
            const resultado = await ObtenerEmailPorUsuario(usuario.trim());
            if (!resultado?.email) {
                setErrorMsg("Usuario no encontrado. Verifica con tu administrador.");
                return;
            }
            await loginEmail({ email: resultado.email, password });
            window.location.href = "/home";
        } catch (err) {
            const msg = err?.message ?? "";
            if (msg.includes("Invalid login") || msg.includes("invalid_credentials") || msg.includes("Wrong")) {
                setErrorMsg("Contraseña incorrecta. Intenta de nuevo.");
            } else {
                setErrorMsg("Error al iniciar sesión. Verifica tu conexión e intenta de nuevo.");
            }
            setCargando(false);
        }
    };

    return (
        <>
        <Pagina>
            {/* ── Decoración de fondo ── */}
            <BgOrb $x="-10%" $y="-8%"  $size="600px" $color="rgba(248,133,51,0.12)"  $dur="7s" />
            <BgOrb $x="70%"  $y="10%"  $size="400px" $color="rgba(99,102,241,0.10)"  $dur="9s" $delay="1s" />
            <BgOrb $x="20%"  $y="55%"  $size="350px" $color="rgba(52,211,153,0.08)"  $dur="11s" $delay="2s" />
            <BgOrb $x="80%"  $y="75%"  $size="500px" $color="rgba(248,133,51,0.08)"  $dur="8s" $delay="0.5s" />
            <BgLines />

            {/* ── Navbar ── */}
            <Navbar $visible={visible}>
                <NavLogo onClick={() => navigate("/")}>
                    <img src={v.logo} alt="logo" />
                    <span>POS<b>.DTO2</b></span>
                </NavLogo>

                <NavCenter>
                    {PLANES.map(p => (
                        <NavDot key={p.id} $color={p.color}
                            onClick={() => document.getElementById(p.id)?.scrollIntoView({ behavior: "smooth" })}>
                            {p.emoji} {p.nombre}
                        </NavDot>
                    ))}
                </NavCenter>

                <BtnIniciarSesion onClick={abrirLogin}>
                    Inicia sesión 👑
                </BtnIniciarSesion>
            </Navbar>

            {/* ── Hero ── */}
            <Hero ref={heroRef} $visible={visible}>
                <HeroBadge>
                    <HeroBadgeDot />
                    Sistema de punto de venta SaaS para Colombia
                </HeroBadge>

                <HeroTitle>
                    Un plan para<br />
                    <TitleGrad>cada historia</TitleGrad>
                </HeroTitle>

                <HeroSub>
                    Sin contratos, sin permanencia, sin letra pequeña.<br />
                    Actívate hoy y empieza a vender en minutos.
                </HeroSub>

                {/* Stats */}
                <StatsBar>
                    {STATS.map((s, i) => (
                        <StatItem key={i}>
                            <StatVal>{s.val}</StatVal>
                            <StatLabel>{s.label}</StatLabel>
                        </StatItem>
                    ))}
                </StatsBar>

                {/* Toggle */}
                <ToggleWrap>
                    <ToggleOpt $active={!anual} onClick={() => setAnual(false)}>Mensual</ToggleOpt>
                    <TogglePill onClick={() => setAnual(!anual)} $on={anual}>
                        <ToggleThumb $on={anual} />
                    </TogglePill>
                    <ToggleOpt $active={anual} onClick={() => setAnual(true)}>
                        Anual <AhorroBadge>−15%</AhorroBadge>
                    </ToggleOpt>
                </ToggleWrap>
            </Hero>

            {/* ── Cards ── */}
            <CardsSection>
                {PLANES.map((plan, idx) => (
                    <PlanCard
                        key={plan.id}
                        id={plan.id}
                        $color={plan.color}
                        $glow={plan.glow}
                        $popular={plan.popular}
                        $delay={`${idx * 0.1}s`}
                        $visible={visible}
                    >
                        {/* Borde animado para popular */}
                        {plan.popular && <RotatingBorder $color={plan.color} $colorAlt={plan.colorAlt} />}

                        {plan.popular && <PopularStrip>⭐ Más elegido por nuestros clientes</PopularStrip>}

                        <CardInner>
                            {/* Header del plan */}
                            <PlanHeader>
                                <EmojiWrap $color={plan.color} $glow={plan.glow}>{plan.emoji}</EmojiWrap>
                                <PlanMeta>
                                    <PlanNombre $color={plan.color}>{plan.nombre}</PlanNombre>
                                    <PlanTagline>{plan.tagline}</PlanTagline>
                                </PlanMeta>
                            </PlanHeader>

                            <PlanDesc>{plan.sub}</PlanDesc>

                            {/* Precio */}
                            <PrecioBloque>
                                <PrecioRow>
                                    <PrecioNum $color={plan.color}>
                                        {formatCOP(anual ? plan.precio_ano : plan.precio_mes)}
                                    </PrecioNum>
                                    <PrecioSufijo>/mes</PrecioSufijo>
                                </PrecioRow>
                                <PrecioNota>
                                    {anual
                                        ? `Facturado anualmente · ${formatCOP((anual ? plan.precio_ano : plan.precio_mes) * 12)}/año`
                                        : "Facturado mensualmente · Cancela cuando quieras"}
                                </PrecioNota>
                            </PrecioBloque>

                            {/* CTA */}
                            <BtnPlan
                                $color={plan.color}
                                $colorAlt={plan.colorAlt}
                                $glow={plan.glow}
                                $popular={plan.popular}
                                onClick={() => abrirPago(plan)}
                            >
                                {plan.popular ? "Comenzar con Fuego 🔥" : `Elegir ${plan.nombre}`}
                            </BtnPlan>

                            <Divisor />

                            {/* Features — editables desde /configuracion/planes */}
                            <FeatureList>
                                {(planFeatures[plan.id] ?? plan.features).map((f, i) => (
                                    <FeatureRow key={i} $ok={f.ok}>
                                        <FeatureIco $ok={f.ok} $color={plan.color}>
                                            {f.ok ? <RiCheckLine /> : <RiCloseLine />}
                                        </FeatureIco>
                                        <span>{f.txt}</span>
                                    </FeatureRow>
                                ))}
                            </FeatureList>
                        </CardInner>
                    </PlanCard>
                ))}
            </CardsSection>

            {/* ── Comparación visual ── */}
            <CompareSection $visible={visible}>
                <CompareTitulo>¿Por qué POS.DTO2?</CompareTitulo>
                <CompareSub>Diseñado para negocios colombianos que quieren crecer sin complicaciones.</CompareSub>
                <CompareGrid>
                    {[
                        { icon: <RiRocketLine />,           title: "Activación inmediata",     desc: "Tu negocio listo para vender en menos de 2 minutos desde que pagas." },
                        { icon: <RiShieldCheckLine />,      title: "Datos 100% seguros",       desc: "Cifrado bancario, backups automáticos y acceso con roles estrictos." },
                        { icon: <RiCustomerService2Line />, title: "Soporte real",              desc: "Personas reales que conocen tu negocio. Nada de bots ni formularios eternos." },
                        { icon: <RiStarLine />,             title: "Sin letra pequeña",         desc: "El precio que ves es lo que pagas. Sin costos ocultos ni sorpresas al final del mes." },
                    ].map((item, i) => (
                        <CompareItem key={i}>
                            <CompareIcon>{item.icon}</CompareIcon>
                            <CompareItemTitle>{item.title}</CompareItemTitle>
                            <CompareItemDesc>{item.desc}</CompareItemDesc>
                        </CompareItem>
                    ))}
                </CompareGrid>
            </CompareSection>

            {/* ── Pregunta frecuente ── */}
            <FaqSection $visible={visible}>
                <CompareTitulo>Preguntas frecuentes</CompareTitulo>
                {[
                    { q: "¿Puedo cambiar de plan después?", a: "Sí, en cualquier momento. Sube o baja de plan sin perder ningún dato y el cambio se aplica de inmediato." },
                    { q: "¿Qué pasa si cancelo?", a: "Puedes cancelar en cualquier momento desde tu perfil. Seguirás usando el sistema hasta el final del período pagado, luego se desactiva." },
                    { q: "¿Necesito instalar algo?", a: "No. POS.DTO2 funciona completamente desde el navegador — en computador, tablet o celular. Sin instalaciones, sin actualizaciones manuales." },
                    { q: "¿Mis datos están seguros en la nube?", a: "Sí. Toda la información está cifrada y almacenada en servidores seguros con backups automáticos cada 24 horas." },
                ].map((faq, i) => (
                    <FaqItem key={i}>
                        <FaqQ>{faq.q}</FaqQ>
                        <FaqA>{faq.a}</FaqA>
                    </FaqItem>
                ))}
            </FaqSection>

            {/* ── CTA Final ── */}
            <CtaFinal $visible={visible}>
                <CtaGlow />
                <CtaEmoji>👋</CtaEmoji>
                <CtaTitulo>¿Tienes dudas? Te ayudamos.</CtaTitulo>
                <CtaDesc>
                    Escríbenos y en minutos te contamos cuál plan se adapta mejor a tu negocio —
                    sin presión, sin ventas agresivas, solo la información que necesitas.
                </CtaDesc>
                <CtaBtns>
                    <BtnWA as="a" href="https://wa.me/573118303017" target="_blank" rel="noopener noreferrer">
                        <RiWhatsappLine size={20} /> Hablar por WhatsApp
                    </BtnWA>
                    <BtnLogin onClick={() => setRegistroOpen(true)}>
                        Regístrate ahora →
                    </BtnLogin>
                </CtaBtns>
            </CtaFinal>

            {/* ── Footer ── */}
            <PlanFooter>
                <FooterLogo onClick={() => navigate("/")}>
                    <img src={v.logo} alt="logo" />
                    <span>POS<b>.DTO2</b></span>
                </FooterLogo>
                <FooterTexto>© {new Date().getFullYear()} ADMA BI · Todos los derechos reservados</FooterTexto>
                <FooterTexto>Bogotá, Colombia 🇨🇴</FooterTexto>
            </PlanFooter>
        </Pagina>

        {/* ══ MODAL DE REGISTRO ══ */}
        <Overlay $open={registroOpen} onClick={cerrarRegistro} />
        <LoginDrawer $open={registroOpen}>
            <DrawerHandle />
            <BtnCerrar onClick={cerrarRegistro}><RiCloseLine /></BtnCerrar>

            <DrawerLogo>
                <img src={v.logo} alt="logo" />
                <span>POS<b>.DTO2</b></span>
            </DrawerLogo>

            {regOk ? (
                <RegExitoWrap>
                    <ConfettiCenter>
                        <ConfettiExplosion force={0.65} duration={3200} particleCount={180} width={600}
                            colors={['#f88533','#fbbf24','#34d399','#818cf8','#fff','#f87171']} />
                    </ConfettiCenter>
                    <RegExitoCirculo>🚀</RegExitoCirculo>
                    <DrawerTitle style={{ textAlign:"center" }}>¡Listo! Te contactamos pronto</DrawerTitle>
                    <DrawerSub style={{ textAlign:"center" }}>
                        Recibimos tu información. En poco tiempo uno de nuestros asesores se pondrá en contacto contigo para ayudarte a elegir el plan ideal.
                    </DrawerSub>
                    <BtnIngresar type="button" disabled={false} onClick={cerrarRegistro} style={{ marginTop: "8px" }}>
                        Cerrar
                    </BtnIngresar>
                </RegExitoWrap>
            ) : (
                <>
                <DrawerTitle>Empieza hoy mismo</DrawerTitle>
                <DrawerSub>Déjanos tus datos y te asesoramos sin compromiso</DrawerSub>
                <LoginForm onSubmit={handleRegistro}>
                    <RegRow>
                        <InputGroup>
                            <InputLabel>Nombre *</InputLabel>
                            <InputField type="text" placeholder="Tu nombre" value={regForm.nombre} onChange={e => setRegForm(f => ({...f, nombre: e.target.value}))} required />
                        </InputGroup>
                        <InputGroup>
                            <InputLabel>Apellido *</InputLabel>
                            <InputField type="text" placeholder="Tu apellido" value={regForm.apellido} onChange={e => setRegForm(f => ({...f, apellido: e.target.value}))} required />
                        </InputGroup>
                    </RegRow>
                    <InputGroup>
                        <InputLabel>Número de contacto *</InputLabel>
                        <InputField type="tel" placeholder="Ej: 3001234567" value={regForm.telefono} onChange={e => setRegForm(f => ({...f, telefono: e.target.value}))} required />
                    </InputGroup>
                    <InputGroup>
                        <InputLabel>Prefiero que me contacten por</InputLabel>
                        <RegContactoRow>
                            <ContactoOpt
                                type="button"
                                $active={regForm.contacto_preferido === "whatsapp"}
                                onClick={() => setRegForm(f => ({...f, contacto_preferido: "whatsapp"}))}
                            >
                                <RiWhatsappLine /> WhatsApp
                            </ContactoOpt>
                            <ContactoOpt
                                type="button"
                                $active={regForm.contacto_preferido === "llamada"}
                                onClick={() => setRegForm(f => ({...f, contacto_preferido: "llamada"}))}
                            >
                                <RiPhoneLine /> Llamada
                            </ContactoOpt>
                        </RegContactoRow>
                    </InputGroup>
                    <InputGroup>
                        <InputLabel>¿Qué negocio tienes? *</InputLabel>
                        <RegTextarea
                            placeholder="Ej: Tienda de ropa, restaurante, distribuidora de papelería..."
                            value={regForm.negocio}
                            onChange={e => setRegForm(f => ({...f, negocio: e.target.value}))}
                            rows={3}
                            required
                        />
                    </InputGroup>
                    {regError && <MsgError>{regError}</MsgError>}
                    <BtnIngresar type="submit" disabled={regCargando || !regForm.nombre || !regForm.apellido || !regForm.telefono || !regForm.negocio}>
                        {regCargando ? "Enviando..." : "Quiero que me contacten 🚀"}
                    </BtnIngresar>
                </LoginForm>
                <DrawerFootNote>
                    ¿Ya tienes cuenta? <span onClick={() => { cerrarRegistro(); abrirLogin(); }}>Inicia sesión aquí</span>
                </DrawerFootNote>
                </>
            )}
        </LoginDrawer>

        {/* ══ PASARELA DE PAGO ══ */}
        <Overlay $open={pagoOpen} onClick={pasoPago === "datos" ? cerrarPago : undefined} />
        <PagoDrawerWrap $open={pagoOpen}>
            <DrawerHandle />
            {pasoPago !== "procesando" && (
                <BtnCerrar onClick={cerrarPago}><RiCloseLine /></BtnCerrar>
            )}

            {/* ─── PASO 1: Datos ─── */}
            {pasoPago === "datos" && planPago && (
                <>
                    <PagoMiniPlan $color={planPago.color} $glow={planPago.glow}>
                        <PagoMiniLeft>
                            <PagoMiniEmoji>{planPago.emoji}</PagoMiniEmoji>
                            <div>
                                <PagoMiniNombre $color={planPago.color}>Plan {planPago.nombre}</PagoMiniNombre>
                                <PagoMiniPeriodo>{anual ? "Facturación anual · −20%" : "Facturación mensual"}</PagoMiniPeriodo>
                            </div>
                        </PagoMiniLeft>
                        <PagoMiniPrecio $color={planPago.color}>
                            {formatCOP(anual ? planPago.precio_ano : planPago.precio_mes)}
                            <PagoMiniPer>/mes</PagoMiniPer>
                        </PagoMiniPrecio>
                    </PagoMiniPlan>

                    <DrawerTitle>Datos para tu cuenta</DrawerTitle>
                    <DrawerSub>Completa la información para activar tu plan</DrawerSub>

                    <LoginForm onSubmit={handlePago}>
                        <RegRow>
                            <InputGroup>
                                <InputLabel>Nombre *</InputLabel>
                                <InputField type="text" placeholder="Tu nombre" value={pagoForm.nombre}
                                    onChange={e => setPagoForm(f => ({...f, nombre: e.target.value}))} required />
                            </InputGroup>
                            <InputGroup>
                                <InputLabel>Apellido *</InputLabel>
                                <InputField type="text" placeholder="Tu apellido" value={pagoForm.apellido}
                                    onChange={e => setPagoForm(f => ({...f, apellido: e.target.value}))} required />
                            </InputGroup>
                        </RegRow>
                        <InputGroup>
                            <InputLabel>Correo electrónico *</InputLabel>
                            <InputField type="email" placeholder="tu@empresa.com" value={pagoForm.email}
                                onChange={e => setPagoForm(f => ({...f, email: e.target.value}))} required />
                        </InputGroup>
                        <InputGroup>
                            <InputLabel>Empresa / negocio *</InputLabel>
                            <InputField type="text" placeholder="Nombre de tu negocio" value={pagoForm.empresa}
                                onChange={e => setPagoForm(f => ({...f, empresa: e.target.value}))} required />
                        </InputGroup>
                        <InputGroup>
                            <InputLabel>Teléfono</InputLabel>
                            <InputField type="tel" placeholder="Ej: 3001234567" value={pagoForm.telefono}
                                onChange={e => setPagoForm(f => ({...f, telefono: e.target.value}))} />
                        </InputGroup>

                        <InputGroup>
                            <InputLabel>Cédula o NIT</InputLabel>
                            <InputField
                                type="text"
                                placeholder="Ej: 1023456789  ·  Sin dígito de verificación"
                                value={pagoForm.cedula}
                                onChange={e => setPagoForm(f => ({...f, cedula: e.target.value.replace(/[^0-9]/g, "")}))}
                                maxLength={15}
                            />
                            <CedulaNota>Si tienes NIT, no incluyas el dígito de verificación (el número después del guion)</CedulaNota>
                        </InputGroup>

                        <InputGroup ref={dropActPagoRef} style={{ position: "relative" }}>
                            <InputLabel>¿A qué se dedica tu negocio? *</InputLabel>
                            <ActDropBtn
                                type="button"
                                $open={dropActPago}
                                $color={planPago.color}
                                $empty={!pagoForm.actividad_economica}
                                onClick={() => setDropActPago(v => !v)}
                            >
                                {pagoForm.actividad_economica
                                    ? <><span>{ACTIVIDADES.find(a => a.key === pagoForm.actividad_economica)?.emoji}</span> {ACTIVIDADES.find(a => a.key === pagoForm.actividad_economica)?.label}</>
                                    : <><RiStoreLine style={{ opacity: 0.5 }} /> Selecciona tu actividad económica</>
                                }
                                <RiArrowDownSLine style={{ marginLeft: "auto", flexShrink: 0, transition: "transform 0.2s", transform: dropActPago ? "rotate(180deg)" : "none" }} />
                            </ActDropBtn>
                            {dropActPago && (
                                <ActDropMenu>
                                    {ACTIVIDADES.map(a => (
                                        <ActDropItem
                                            key={a.key}
                                            type="button"
                                            $activo={pagoForm.actividad_economica === a.key}
                                            $color={planPago.color}
                                            onClick={() => { setPagoForm(f => ({...f, actividad_economica: a.key})); setDropActPago(false); }}
                                        >
                                            <span>{a.emoji}</span> {a.label}
                                        </ActDropItem>
                                    ))}
                                </ActDropMenu>
                            )}
                        </InputGroup>

                        <PagoSubtotal $color={planPago.color}>
                            <PagoSubRow>
                                <span>Plan {planPago.nombre} · {anual ? "Anual" : "Mensual"}</span>
                                <span>{formatCOP(anual ? planPago.precio_ano : planPago.precio_mes)}/mes</span>
                            </PagoSubRow>
                            {anual && (
                                <PagoSubRow $highlight>
                                    <span>Total a facturar hoy</span>
                                    <span style={{ color: planPago.color, fontWeight: 900 }}>
                                        {formatCOP(planPago.precio_ano * 12)}/año
                                    </span>
                                </PagoSubRow>
                            )}
                        </PagoSubtotal>

                        {pagoError && <MsgError>{pagoError}</MsgError>}

                        <BtnPagoSubmit type="submit" $color={planPago.color} $colorAlt={planPago.colorAlt} $glow={planPago.glow}
                            disabled={!pagoForm.nombre || !pagoForm.apellido || !pagoForm.email || !pagoForm.empresa || !pagoForm.cedula || !pagoForm.actividad_economica}>
                            <RiLockLine /> Ir al pago seguro →
                        </BtnPagoSubmit>
                    </LoginForm>

                    <PagoSeguridad>
                        <RiShieldLine /> Pago cifrado · Sin permanencia · Cancela cuando quieras
                    </PagoSeguridad>
                </>
            )}

            {/* ─── PASO 2: Procesando ─── */}
            {pasoPago === "procesando" && planPago && (
                <PagoProc>
                    <OrbitWrap>
                        <OrbitRing $color={planPago.color}>
                            <OrbitDot $color={planPago.color} />
                        </OrbitRing>
                        <OrbitRing2 $color={planPago.color}>
                            <OrbitDot2 $color={planPago.colorAlt} />
                        </OrbitRing2>
                        <OrbitCenter>
                            <img src={v.logo} alt="logo" width={38} height={38} style={{ objectFit:"contain" }} />
                        </OrbitCenter>
                    </OrbitWrap>
                    <PagoProcEmoji>{planPago.emoji}</PagoProcEmoji>
                    <PagoProcTitle>Procesando tu pago</PagoProcTitle>
                    <PagoProcMsg key={pagoMsgIdx}>{PROCESS_MSGS[pagoMsgIdx]}</PagoProcMsg>
                    <ProgressBar>
                        <ProgressFill $color={planPago.color} />
                    </ProgressBar>
                    <PagoProcNote>🔒 Conexión segura · No cierres esta ventana</PagoProcNote>
                </PagoProc>
            )}

        </PagoDrawerWrap>

        {/* ══ MODAL DE LOGIN ══ */}
        <Overlay $open={loginOpen} onClick={cerrarLogin} />

        <LoginDrawer $open={loginOpen}>
            <DrawerHandle />
            <BtnCerrar onClick={cerrarLogin}><RiCloseLine /></BtnCerrar>

            <DrawerLogo>
                <img src={v.logo} alt="logo" />
                <span>POS<b>.DTO2</b></span>
            </DrawerLogo>

            <DrawerTitle>Bienvenido de vuelta</DrawerTitle>
            <DrawerSub>Ingresa tus credenciales para acceder</DrawerSub>

            <LoginForm onSubmit={handleLogin}>
                <InputGroup>
                    <InputLabel>Usuario</InputLabel>
                    <InputField
                        type="text"
                        placeholder="Tu nombre de usuario"
                        value={usuario}
                        onChange={e => setUsuario(e.target.value)}
                        autoComplete="username"
                        autoFocus={loginOpen}
                        required
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel>Contraseña</InputLabel>
                    <InputWrap>
                        <InputField
                            type={showPass ? "text" : "password"}
                            placeholder="Tu contraseña"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            style={{ paddingRight: "48px" }}
                        />
                        <BtnEye type="button" onClick={() => setShowPass(!showPass)}>
                            {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                        </BtnEye>
                    </InputWrap>
                </InputGroup>
                {errorMsg && <MsgError>{errorMsg}</MsgError>}
                <BtnIngresar type="submit" disabled={cargando || !usuario || !password}>
                    {cargando ? "Ingresando..." : "Ingresar al sistema →"}
                </BtnIngresar>
            </LoginForm>

            <DrawerFootNote>
                ¿Nuevo por acá? <span onClick={cerrarLogin}>Ver los planes arriba</span>
            </DrawerFootNote>
        </LoginDrawer>
    </>
    );
}

/* ═══════════════════════════════════════
   ANIMACIONES
═══════════════════════════════════════ */
const floatOrb = keyframes`
    0%, 100% { transform: translate(0, 0)   scale(1); }
    33%       { transform: translate(30px, -20px) scale(1.08); }
    66%       { transform: translate(-20px, 15px) scale(0.95); }
`;

const fadeSlideUp = keyframes`
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const gradAnim = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const rotateFull = keyframes`
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(0.94); }
`;

const shimmer = keyframes`
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
`;

const blink = keyframes`
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
`;

/* ═══════════════════════════════════════
   LAYOUT
═══════════════════════════════════════ */
const Pagina = styled.div`
    min-height: 100vh;
    background: #07090f;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow-x: hidden;
    font-family: "Poppins", sans-serif;
`;

/* ── Orbs de fondo ── */
const BgOrb = styled.div`
    position: fixed;
    left: ${({ $x }) => $x};
    top:  ${({ $y }) => $y};
    width:  ${({ $size }) => $size};
    height: ${({ $size }) => $size};
    border-radius: 50%;
    background: ${({ $color }) => $color};
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
    animation: ${floatOrb} ${({ $dur }) => $dur} ease-in-out infinite;
    animation-delay: ${({ $delay }) => $delay ?? "0s"};
`;

const BgLines = styled.div`
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
        linear-gradient(rgba(248,133,51,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(248,133,51,0.035) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%);
`;

/* ── Navbar ── */
const Navbar = styled.nav`
    position: relative;
    z-index: 20;
    width: 100%;
    max-width: 1140px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 32px;
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transform: ${({ $visible }) => $visible ? "none" : "translateY(-16px)"};
    transition: opacity 0.5s ease, transform 0.5s ease;

    @media (max-width: 767px) { padding: 18px 18px; }
`;

const NavLogo = styled.button`
    display: flex; align-items: center; gap: 10px;
    background: none; border: none; cursor: pointer;
    img { width: 34px; height: 34px; object-fit: contain; }
    span { font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.3px; b { color: #f88533; } }
`;

const NavCenter = styled.div`
    display: flex; gap: 6px;

    @media (max-width: 767px) { display: none; }
`;

const NavDot = styled.button`
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.55);
    font-size: 12px; font-weight: 700;
    font-family: "Poppins", sans-serif;
    padding: 6px 14px;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.18s;
    &:hover { background: ${({ $color }) => `${$color}22`}; border-color: ${({ $color }) => $color}66; color: ${({ $color }) => $color}; }
`;

const BtnIniciarSesion = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    border-radius: 999px;
    border: 2px solid #B56B12;
    background: #E8891A;
    color: #fff;
    font-size: 13px; font-weight: 800;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(232,137,26,0.35), 3px 3px 0 #B56B12;
    transition: all 0.18s;
    white-space: nowrap;
    &:hover  { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 22px rgba(232,137,26,0.45), 3px 3px 0 #B56B12; }
    &:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 #B56B12; }

    @media (max-width: 767px) {
        font-size: 12px; padding: 9px 16px;
    }
`;

/* ── Styled modal de login ── */
const Overlay = styled.div`
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(8px);
    z-index: 300;
    pointer-events: ${({ $open }) => $open ? "all" : "none"};
    opacity: ${({ $open }) => $open ? 1 : 0};
    transition: opacity 0.3s ease;
`;

const LoginDrawer = styled.div`
    position: fixed; z-index: 301;
    background: #0d1117;
    display: flex; flex-direction: column; gap: 18px;

    @media (min-width: 769px) {
        top: 0; right: 0; bottom: 0; width: 420px;
        padding: 40px 36px;
        border-left: 1px solid rgba(248,133,51,0.2);
        box-shadow: -12px 0 48px rgba(0,0,0,0.6);
        transform: ${({ $open }) => $open ? "translateX(0)" : "translateX(100%)"};
        opacity: ${({ $open }) => $open ? 1 : 0};
        transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
        overflow-y: auto;
    }

    @media (max-width: 768px) {
        left: 0; right: 0; bottom: 0;
        border-radius: 28px 28px 0 0;
        padding: 12px 24px 40px;
        border-top: 1px solid rgba(248,133,51,0.2);
        box-shadow: 0 -12px 48px rgba(0,0,0,0.7);
        transform: ${({ $open }) => $open ? "translateY(0)" : "translateY(100%)"};
        opacity: ${({ $open }) => $open ? 1 : 0};
        transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
        max-height: 92vh; overflow-y: auto;
    }
`;

const DrawerHandle = styled.div`
    width: 40px; height: 4px; border-radius: 999px;
    background: rgba(255,255,255,0.15);
    align-self: center; margin-bottom: 4px;
    @media (min-width: 769px) { display: none; }
`;

const BtnCerrar = styled.button`
    position: absolute; top: 16px; right: 16px;
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.6); font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const DrawerLogo = styled.div`
    display: flex; align-items: center; gap: 8px; margin-top: 8px;
    img { width: 28px; height: 28px; object-fit: contain; }
    span { font-size: 16px; font-weight: 900; color: #fff; b { color: #f88533; } }
`;

const DrawerTitle = styled.h2`
    font-size: 22px; font-weight: 900; margin: 0; color: #fff; letter-spacing: -0.3px;
`;

const DrawerSub = styled.p`
    font-size: 13px; color: rgba(255,255,255,0.45); margin: -8px 0 0; line-height: 1.5;
`;

const LoginForm = styled.form`
    display: flex; flex-direction: column; gap: 14px;
`;

const InputGroup = styled.div`
    display: flex; flex-direction: column; gap: 6px;
`;

const InputLabel = styled.label`
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: rgba(255,255,255,0.4);
`;

const InputWrap = styled.div`
    position: relative;
`;

const InputField = styled.input`
    width: 100%; padding: 14px 16px; border-radius: 12px;
    border: 2px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 16px; font-family: "Poppins", sans-serif;
    outline: none; box-sizing: border-box; min-height: 52px;
    transition: border-color 0.2s;
    &:focus { border-color: #f88533; }
    &::placeholder { color: rgba(255,255,255,0.25); }
`;

const CedulaNota = styled.span`
    font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.5;
`;

const ActDropBtn = styled.button`
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 14px 16px; border-radius: 12px; cursor: pointer; min-height: 52px;
    border: 2px solid ${({ $open, $color }) => $open ? $color : "rgba(255,255,255,0.1)"};
    background: rgba(255,255,255,0.05);
    color: ${({ $empty }) => $empty ? "rgba(255,255,255,0.35)" : "#fff"};
    font-size: 15px; font-family: "Poppins", sans-serif; text-align: left;
    transition: border-color 0.2s;
    &:hover { border-color: ${({ $color }) => $color}; }
`;

const ActDropMenu = styled.div`
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 500;
    background: #0f1520;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px; padding: 6px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    max-height: 260px; overflow-y: auto;
`;

const ActDropItem = styled.button`
    width: 100%; display: flex; align-items: center; gap: 10px;
    text-align: left; padding: 11px 14px; border-radius: 10px;
    border: none; cursor: pointer; font-size: 14px; font-weight: 600;
    font-family: "Poppins", sans-serif;
    background: ${({ $activo, $color }) => $activo ? `${$color}22` : "transparent"};
    color: ${({ $activo, $color }) => $activo ? $color : "rgba(255,255,255,0.8)"};
    transition: background 0.12s;
    &:hover { background: rgba(255,255,255,0.06); }
`;

const BtnEye = styled.button`
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.35); font-size: 20px;
    display: flex; align-items: center;
    transition: color 0.15s;
    &:hover { color: #f88533; }
`;

const MsgError = styled.p`
    color: #f87171; font-size: 13px; font-weight: 600;
    text-align: center; margin: 0;
    background: rgba(248,113,113,0.1); padding: 10px 14px; border-radius: 10px;
    border: 1px solid rgba(248,113,113,0.25);
`;

const BtnIngresar = styled.button`
    width: 100%; padding: 16px; min-height: 54px; border-radius: 14px;
    border: 2px solid ${({ disabled }) => disabled ? "rgba(255,255,255,0.1)" : "#B56B12"};
    background: ${({ disabled }) => disabled ? "rgba(255,255,255,0.06)" : "#E8891A"};
    color: ${({ disabled }) => disabled ? "rgba(255,255,255,0.35)" : "#fff"};
    font-size: 16px; font-weight: 800; cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    font-family: "Poppins", sans-serif;
    box-shadow: ${({ disabled }) => disabled ? "none" : "4px 4px 0 #B56B12"};
    transition: box-shadow 0.1s, transform 0.1s, filter 0.1s;
    &:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
    &:active:not(:disabled) { box-shadow: 2px 2px 0 #B56B12; transform: translate(2px,2px); }
`;

const DrawerFootNote = styled.p`
    font-size: 13px; text-align: center; color: rgba(255,255,255,0.35); margin: 0;
    span { color: #f88533; font-weight: 700; cursor: pointer; &:hover { text-decoration: underline; } }
`;

const RegRow = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    @media (max-width: 420px) { grid-template-columns: 1fr; }
`;

const RegContactoRow = styled.div`
    display: flex; gap: 10px;
`;

const ContactoOpt = styled.button`
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px; border-radius: 12px; font-size: 13px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer; transition: all 0.15s;
    border: 2px solid ${({ $active }) => $active ? "#f88533" : "rgba(255,255,255,0.1)"};
    background: ${({ $active }) => $active ? "rgba(248,133,51,0.15)" : "rgba(255,255,255,0.04)"};
    color: ${({ $active }) => $active ? "#f88533" : "rgba(255,255,255,0.5)"};
    &:hover { border-color: #f88533; color: #f88533; }
`;

const RegTextarea = styled.textarea`
    width: 100%; padding: 12px 14px; border-radius: 12px;
    border: 2px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #fff; font-size: 15px; font-family: "Poppins", sans-serif;
    outline: none; resize: none; box-sizing: border-box; line-height: 1.5;
    transition: border-color 0.2s;
    &:focus { border-color: #f88533; }
    &::placeholder { color: rgba(255,255,255,0.25); }
`;

/* ── Hero ── */
const Hero = styled.section`
    position: relative; z-index: 1;
    text-align: center;
    padding: 32px 24px 60px;
    max-width: 780px;
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transform: ${({ $visible }) => $visible ? "none" : "translateY(24px)"};
    transition: opacity 0.6s 0.1s ease, transform 0.6s 0.1s ease;

    @media (max-width: 767px) { padding: 20px 20px 44px; }
`;

const HeroBadge = styled.div`
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 18px;
    border-radius: 999px;
    border: 1px solid rgba(248,133,51,0.3);
    background: rgba(248,133,51,0.07);
    color: #f88533;
    font-size: 12px; font-weight: 700;
    letter-spacing: 0.3px;
    margin-bottom: 24px;
    text-transform: uppercase;
`;

const HeroBadgeDot = styled.div`
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #f88533;
    animation: ${blink} 1.8s ease-in-out infinite;
`;

const HeroTitle = styled.h1`
    font-size: clamp(38px, 6vw, 64px);
    font-weight: 900;
    line-height: 1.1;
    margin: 0 0 18px;
    letter-spacing: -1px;
`;

const TitleGrad = styled.span`
    background: linear-gradient(90deg, #f88533 0%, #fbbf24 40%, #f56a00 70%, #f88533 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${gradAnim} 3.5s ease infinite;
`;

const HeroSub = styled.p`
    font-size: 16px;
    color: rgba(255,255,255,0.45);
    line-height: 1.75;
    margin: 0 0 36px;

    @media (max-width: 767px) { font-size: 14px; }
`;

/* Stats */
const StatsBar = styled.div`
    display: flex; gap: 0;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(12px);
    overflow: hidden;
    margin-bottom: 32px;

    @media (max-width: 767px) {
        display: grid; grid-template-columns: 1fr 1fr;
    }
`;

const StatItem = styled.div`
    flex: 1;
    padding: 16px 20px;
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    border-right: 1px solid rgba(255,255,255,0.06);
    &:last-child { border-right: none; }
`;

const StatVal = styled.span`
    font-size: 20px; font-weight: 900;
    background: linear-gradient(90deg, #f88533, #fbbf24);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const StatLabel = styled.span`
    font-size: 11px; color: rgba(255,255,255,0.38); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.4px;
`;

/* Toggle */
const ToggleWrap = styled.div`
    display: inline-flex; align-items: center; gap: 14px;
`;

const ToggleOpt = styled.span`
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    color: ${({ $active }) => $active ? "#fff" : "rgba(255,255,255,0.3)"};
    transition: color 0.22s;
`;

const TogglePill = styled.div`
    width: 52px; height: 28px;
    border-radius: 999px;
    background: ${({ $on }) => $on ? "linear-gradient(90deg, #f88533, #f56a00)" : "rgba(255,255,255,0.1)"};
    border: 1.5px solid ${({ $on }) => $on ? "#f56a0088" : "rgba(255,255,255,0.15)"};
    position: relative; cursor: pointer;
    transition: background 0.28s, border-color 0.28s;
`;

const ToggleThumb = styled.div`
    position: absolute; top: 3px;
    left: ${({ $on }) => $on ? "24px" : "3px"};
    width: 18px; height: 18px;
    border-radius: 50%; background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    transition: left 0.28s cubic-bezier(0.4,0,0.2,1);
`;

const AhorroBadge = styled.span`
    background: linear-gradient(90deg, #10b981, #059669);
    color: #fff; font-size: 10px; font-weight: 800;
    padding: 2px 8px; border-radius: 999px;
`;

/* ── Cards ── */
const CardsSection = styled.div`
    position: relative; z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
    width: 100%; max-width: 1100px;
    padding: 0 24px;

    @media (max-width: 960px) { grid-template-columns: 1fr; max-width: 460px; padding: 0 16px; gap: 20px; }
`;

const PlanCard = styled.div`
    position: relative;
    border-radius: 28px;
    overflow: hidden;
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transform: ${({ $visible }) => $visible ? "translateY(0)" : "translateY(32px)"};
    transition: opacity 0.6s ${({ $delay }) => $delay} ease, transform 0.6s ${({ $delay }) => $delay} ease,
                box-shadow 0.25s ease;

    ${({ $popular, $color, $glow }) => $popular ? css`
        background: linear-gradient(160deg, #130d00 0%, #0d0800 100%);
        box-shadow: 0 0 60px ${$glow}, 0 24px 64px rgba(0,0,0,0.6);
        transform: ${({ $visible }) => $visible ? "scale(1.03)" : "translateY(32px) scale(1.03)"};
        &:hover { box-shadow: 0 0 80px ${$glow}, 0 32px 80px rgba(0,0,0,0.7); transform: scale(1.04) translateY(-4px); }
        @media (max-width: 960px) { transform: none; &:hover { transform: translateY(-4px); } }
    ` : css`
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 4px 32px rgba(0,0,0,0.4);
        &:hover {
            box-shadow: 0 8px 48px ${$glow}, 0 20px 56px rgba(0,0,0,0.5);
            border-color: ${$color}44;
            transform: translateY(-6px);
        }
    `}
`;

/* Borde giratorio solo en la card popular */
const RotatingBorder = styled.div`
    position: absolute; inset: -2px;
    border-radius: 30px;
    background: conic-gradient(from 0deg, ${({ $color }) => $color}, ${({ $colorAlt }) => $colorAlt}, #fbbf24, ${({ $color }) => $color});
    z-index: 0;
    animation: ${rotateFull} 4s linear infinite;

    &::after {
        content: '';
        position: absolute; inset: 2px;
        border-radius: 28px;
        background: #130d00;
    }
`;

const PopularStrip = styled.div`
    position: relative; z-index: 2;
    background: linear-gradient(90deg, #f88533, #f56a00, #fbbf24, #f88533);
    background-size: 200% auto;
    animation: ${shimmer} 2.5s linear infinite;
    color: #fff;
    text-align: center;
    font-size: 12px; font-weight: 800;
    padding: 8px 16px;
    letter-spacing: 0.3px;
`;

const CardInner = styled.div`
    position: relative; z-index: 2;
    padding: 28px 26px 26px;
    display: flex; flex-direction: column; gap: 18px;
    backdrop-filter: blur(4px);
`;

const PlanHeader = styled.div`
    display: flex; align-items: center; gap: 14px;
`;

const EmojiWrap = styled.div`
    width: 52px; height: 52px;
    border-radius: 16px;
    background: ${({ $color }) => `${$color}18`};
    border: 1.5px solid ${({ $color }) => `${$color}33`};
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
    box-shadow: 0 0 20px ${({ $glow }) => $glow};
    flex-shrink: 0;
    animation: ${pulse} 3s ease-in-out infinite;
`;

const PlanMeta = styled.div`
    display: flex; flex-direction: column; gap: 2px;
`;

const PlanNombre = styled.h3`
    font-size: 22px; font-weight: 900;
    margin: 0; color: ${({ $color }) => $color};
    letter-spacing: -0.3px;
`;

const PlanTagline = styled.span`
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase; letter-spacing: 0.4px;
`;

const PlanDesc = styled.p`
    font-size: 13.5px; color: rgba(255,255,255,0.5);
    margin: 0; line-height: 1.6;
`;

const PrecioBloque = styled.div`
    display: flex; flex-direction: column; gap: 4px;
`;

const PrecioRow = styled.div`
    display: flex; align-items: baseline; gap: 6px;
`;

const PrecioNum = styled.span`
    font-size: 28px; font-weight: 900;
    color: ${({ $color }) => $color};
    letter-spacing: -0.5px;
    transition: color 0.3s;
`;

const PrecioSufijo = styled.span`
    font-size: 14px; color: rgba(255,255,255,0.3); font-weight: 600;
`;

const PrecioNota = styled.p`
    font-size: 11px; color: rgba(255,255,255,0.25); margin: 0;
`;

const BtnPlan = styled.button`
    width: 100%; padding: 15px 20px;
    border-radius: 14px;
    border: 2px solid ${({ $colorAlt }) => `${$colorAlt}88`};
    background: ${({ $color, $colorAlt }) => `linear-gradient(135deg, ${$color} 0%, ${$colorAlt} 100%)`};
    color: #fff;
    font-size: 15px; font-weight: 800;
    font-family: "Poppins", sans-serif;
    cursor: pointer; letter-spacing: 0.2px;
    box-shadow: ${({ $glow }) => `0 6px 24px ${$glow}, 4px 4px 0 rgba(0,0,0,0.3)`};
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    &:hover  { filter: brightness(1.14); transform: translateY(-2px); box-shadow: ${({ $glow }) => `0 10px 32px ${$glow}`}; }
    &:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 rgba(0,0,0,0.4); }
`;

const Divisor = styled.div`
    height: 1px; background: rgba(255,255,255,0.07);
`;

const FeatureList = styled.ul`
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 10px;
`;

const FeatureRow = styled.li`
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 500;
    color: ${({ $ok }) => $ok ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)"};
    text-decoration: ${({ $ok }) => $ok ? "none" : "line-through"};
`;

const FeatureIco = styled.span`
    display: flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 6px;
    font-size: 14px; flex-shrink: 0;
    background: ${({ $ok, $color }) => $ok ? `${$color}20` : "rgba(255,255,255,0.04)"};
    color: ${({ $ok, $color }) => $ok ? $color : "rgba(255,255,255,0.18)"};
`;

/* ── Sección comparación ── */
const CompareSection = styled.section`
    position: relative; z-index: 1;
    width: 100%; max-width: 1100px;
    padding: 80px 24px 0;
    text-align: center;
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transform: ${({ $visible }) => $visible ? "none" : "translateY(24px)"};
    transition: opacity 0.6s 0.3s ease, transform 0.6s 0.3s ease;

    @media (max-width: 767px) { padding: 60px 16px 0; }
`;

const CompareTitulo = styled.h2`
    font-size: clamp(22px, 3.5vw, 36px); font-weight: 900;
    margin: 0 0 12px; letter-spacing: -0.4px;
`;

const CompareSub = styled.p`
    font-size: 15px; color: rgba(255,255,255,0.4);
    margin: 0 0 40px; line-height: 1.65;
`;

const CompareGrid = styled.div`
    display: grid; grid-template-columns: repeat(4,1fr); gap: 16px;
    @media (max-width: 900px) { grid-template-columns: repeat(2,1fr); }
    @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

const CompareItem = styled.div`
    padding: 24px 20px; border-radius: 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(12px);
    display: flex; flex-direction: column; gap: 10px;
    text-align: left;
    transition: border-color 0.2s, background 0.2s;
    &:hover { border-color: rgba(248,133,51,0.3); background: rgba(248,133,51,0.04); }
`;

const CompareIcon = styled.span`
    display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(248,133,51,0.12);
    color: #f88533; font-size: 22px;
`;

const CompareItemTitle = styled.h4`
    font-size: 15px; font-weight: 800; margin: 0; color: #fff;
`;

const CompareItemDesc = styled.p`
    font-size: 13px; color: rgba(255,255,255,0.42); margin: 0; line-height: 1.6;
`;

/* ── FAQ ── */
const FaqSection = styled.section`
    position: relative; z-index: 1;
    width: 100%; max-width: 760px;
    padding: 72px 24px 0;
    text-align: center;
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transform: ${({ $visible }) => $visible ? "none" : "translateY(24px)"};
    transition: opacity 0.6s 0.4s ease, transform 0.6s 0.4s ease;

    ${CompareTitulo} { margin-bottom: 32px; }
    @media (max-width: 767px) { padding: 56px 16px 0; }
`;

const FaqItem = styled.div`
    text-align: left; padding: 20px 24px;
    border-radius: 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 12px;
    transition: border-color 0.2s;
    &:hover { border-color: rgba(248,133,51,0.25); }
`;

const FaqQ = styled.p`
    font-size: 14px; font-weight: 800; color: #fff; margin: 0 0 6px;
`;

const FaqA = styled.p`
    font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.65;
`;

/* ── CTA Final ── */
const CtaFinal = styled.section`
    position: relative; z-index: 1;
    text-align: center;
    padding: 80px 24px 0;
    max-width: 640px;
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transform: ${({ $visible }) => $visible ? "none" : "translateY(24px)"};
    transition: opacity 0.6s 0.5s ease, transform 0.6s 0.5s ease;

    @media (max-width: 767px) { padding: 60px 20px 0; }
`;

const CtaGlow = styled.div`
    position: absolute; top: 60px; left: 50%; transform: translateX(-50%);
    width: 400px; height: 200px;
    background: radial-gradient(ellipse, rgba(248,133,51,0.18) 0%, transparent 70%);
    pointer-events: none; z-index: -1;
`;

const CtaEmoji = styled.div`
    font-size: 52px; line-height: 1; margin-bottom: 16px;
    animation: ${pulse} 2.8s ease-in-out infinite;
`;

const CtaTitulo = styled.h2`
    font-size: clamp(26px, 4vw, 42px); font-weight: 900;
    margin: 0 0 14px; letter-spacing: -0.5px;
`;

const CtaDesc = styled.p`
    font-size: 15px; color: rgba(255,255,255,0.45);
    margin: 0 0 36px; line-height: 1.7;
`;

const CtaBtns = styled.div`
    display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
`;

const BtnWA = styled.button`
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 28px; border-radius: 14px;
    border: 2px solid #16a34a88;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff; font-size: 15px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer; text-decoration: none;
    box-shadow: 0 6px 24px rgba(22,163,74,0.4), 4px 4px 0 #14532d;
    transition: transform 0.15s, filter 0.15s;
    &:hover  { filter: brightness(1.12); transform: translateY(-2px); }
    &:active { transform: translate(2px,2px); }
`;

const BtnLogin = styled.button`
    padding: 15px 28px; border-radius: 14px;
    border: 2px solid rgba(248,133,51,0.5);
    background: rgba(248,133,51,0.08);
    color: #f88533; font-size: 15px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    backdrop-filter: blur(8px);
    transition: all 0.18s;
    &:hover { background: rgba(248,133,51,0.15); border-color: #f88533; transform: translateY(-2px); }
`;

/* ── Footer ── */
const PlanFooter = styled.footer`
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 72px 24px 40px;
`;

const FooterLogo = styled.button`
    display: flex; align-items: center; gap: 8px;
    background: none; border: none; cursor: pointer; margin-bottom: 4px;
    img { width: 28px; height: 28px; object-fit: contain; }
    span { font-size: 16px; font-weight: 900; color: rgba(255,255,255,0.4); b { color: #f8853355; } }
`;

const FooterTexto = styled.span`
    font-size: 12px; color: rgba(255,255,255,0.2);
`;

/* ══════════════════════════════════════
   PASARELA DE PAGO — STYLED COMPONENTS
══════════════════════════════════════ */
const orbit1 = keyframes`
    from { transform: rotate(0deg) translateX(62px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(62px) rotate(-360deg); }
`;
const orbit2 = keyframes`
    from { transform: rotate(180deg) translateX(44px) rotate(-180deg); }
    to   { transform: rotate(540deg) translateX(44px) rotate(-540deg); }
`;
const progressAnim = keyframes`
    0%   { width: 0%; }
    30%  { width: 35%; }
    65%  { width: 72%; }
    85%  { width: 88%; }
    100% { width: 96%; }
`;
const msgFadeIn = keyframes`
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
`;
const checkPop = keyframes`
    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.18) rotate(5deg); opacity: 1; }
    80%  { transform: scale(0.93) rotate(-2deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;
const slideCard = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const PagoDrawerWrap = styled.div`
    position: fixed; z-index: 301;
    background: #080b12;
    display: flex; flex-direction: column; gap: 16px;

    @media (min-width: 769px) {
        top: 0; right: 0; bottom: 0; width: 480px;
        padding: 40px 36px;
        border-left: 1px solid rgba(255,255,255,0.07);
        box-shadow: -16px 0 64px rgba(0,0,0,0.7);
        transform: ${({ $open }) => $open ? "translateX(0)" : "translateX(100%)"};
        opacity: ${({ $open }) => $open ? 1 : 0};
        transition: transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease;
        overflow-y: auto;
    }

    @media (max-width: 768px) {
        left: 0; right: 0; bottom: 0;
        border-radius: 28px 28px 0 0;
        padding: 12px 22px 40px;
        border-top: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 -16px 64px rgba(0,0,0,0.8);
        transform: ${({ $open }) => $open ? "translateY(0)" : "translateY(100%)"};
        opacity: ${({ $open }) => $open ? 1 : 0};
        transition: transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease;
        max-height: 93vh; overflow-y: auto;
    }
`;

/* Mini resumen del plan seleccionado */
const PagoMiniPlan = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-radius: 16px;
    background: ${({ $color }) => `${$color}12`};
    border: 1.5px solid ${({ $color }) => `${$color}35`};
    box-shadow: 0 0 28px ${({ $glow }) => $glow};
`;
const PagoMiniLeft = styled.div`
    display: flex; align-items: center; gap: 12px;
`;
const PagoMiniEmoji = styled.span`
    font-size: 28px; line-height: 1;
`;
const PagoMiniNombre = styled.span`
    display: block; font-size: 15px; font-weight: 900;
    color: ${({ $color }) => $color};
`;
const PagoMiniPeriodo = styled.span`
    display: block; font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.3px;
`;
const PagoMiniPrecio = styled.div`
    font-size: 20px; font-weight: 900;
    color: ${({ $color }) => $color};
    display: flex; align-items: baseline; gap: 3px;
`;
const PagoMiniPer = styled.span`
    font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 600;
`;

/* Subtotal box */
const PagoSubtotal = styled.div`
    border-radius: 12px; padding: 14px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid ${({ $color }) => `${$color}25`};
    display: flex; flex-direction: column; gap: 8px;
`;
const PagoSubRow = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    font-size: ${({ $highlight }) => $highlight ? "14px" : "13px"};
    font-weight: ${({ $highlight }) => $highlight ? "800" : "600"};
    color: ${({ $highlight }) => $highlight ? "#fff" : "rgba(255,255,255,0.45)"};
    border-top: ${({ $highlight }) => $highlight ? "1px solid rgba(255,255,255,0.08)" : "none"};
    padding-top: ${({ $highlight }) => $highlight ? "8px" : "0"};
`;

/* Botón de pago con color del plan */
const BtnPagoSubmit = styled.button`
    width: 100%; padding: 16px 20px; min-height: 56px; border-radius: 14px;
    border: 2px solid ${({ $colorAlt, disabled }) => disabled ? "rgba(255,255,255,0.08)" : `${$colorAlt}99`};
    background: ${({ $color, $colorAlt, disabled }) => disabled
        ? "rgba(255,255,255,0.05)"
        : `linear-gradient(135deg, ${$color} 0%, ${$colorAlt} 100%)`};
    color: ${({ disabled }) => disabled ? "rgba(255,255,255,0.3)" : "#fff"};
    font-size: 15px; font-weight: 800;
    font-family: "Poppins", sans-serif;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: ${({ $glow, disabled }) => disabled ? "none" : `0 6px 24px ${$glow}, 4px 4px 0 rgba(0,0,0,0.3)`};
    transition: filter 0.15s, transform 0.15s, box-shadow 0.15s;
    letter-spacing: 0.2px;
    &:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-2px); }
    &:active:not(:disabled) { transform: translate(2px,2px); box-shadow: 1px 1px 0 rgba(0,0,0,0.4); }
`;

/* Nota de seguridad */
const PagoSeguridad = styled.p`
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 12px; color: rgba(255,255,255,0.28); text-align: center; margin: 0;
    svg { font-size: 14px; color: rgba(52,211,153,0.7); }
`;

/* ── Paso 2: Procesando ── */
const PagoProc = styled.div`
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px; padding: 20px 0;
    text-align: center;
`;
const OrbitWrap = styled.div`
    position: relative;
    width: 148px; height: 148px;
    display: flex; align-items: center; justify-content: center;
`;
const OrbitRing = styled.div`
    position: absolute;
    width: 140px; height: 140px;
    border-radius: 50%;
    border: 1.5px dashed ${({ $color }) => `${$color}40`};
    display: flex; align-items: center; justify-content: center;
`;
const OrbitDot = styled.div`
    width: 10px; height: 10px; border-radius: 50%;
    background: ${({ $color }) => $color};
    box-shadow: 0 0 12px ${({ $color }) => $color}, 0 0 4px ${({ $color }) => $color};
    position: absolute;
    animation: ${orbit1} 2.4s linear infinite;
`;
const OrbitRing2 = styled.div`
    position: absolute;
    width: 96px; height: 96px;
    border-radius: 50%;
    border: 1.5px dashed ${({ $color }) => `${$color}30`};
`;
const OrbitDot2 = styled.div`
    width: 7px; height: 7px; border-radius: 50%;
    background: ${({ $color }) => $color};
    box-shadow: 0 0 8px ${({ $color }) => $color};
    position: absolute;
    animation: ${orbit2} 1.8s linear infinite;
`;
const OrbitCenter = styled.div`
    position: absolute; z-index: 2;
    width: 60px; height: 60px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    animation: ${pulse} 2s ease-in-out infinite;
`;
const PagoProcEmoji = styled.div`
    font-size: 36px; line-height: 1;
    animation: ${pulse} 1.6s ease-in-out infinite;
`;
const PagoProcTitle = styled.h3`
    font-size: 22px; font-weight: 900; color: #fff; margin: 0;
`;
const PagoProcMsg = styled.p`
    font-size: 13px; color: rgba(255,255,255,0.45); margin: 0;
    animation: ${msgFadeIn} 0.4s ease;
`;
const ProgressBar = styled.div`
    width: 100%; max-width: 280px; height: 5px;
    border-radius: 999px; background: rgba(255,255,255,0.07);
    overflow: hidden;
`;
const ProgressFill = styled.div`
    height: 100%; border-radius: 999px;
    background: ${({ $color }) => `linear-gradient(90deg, ${$color}99, ${$color})`};
    animation: ${progressAnim} 3.2s cubic-bezier(0.4,0,0.2,1) forwards;
`;
const PagoProcNote = styled.p`
    font-size: 11px; color: rgba(255,255,255,0.22); margin: 0;
    letter-spacing: 0.2px;
`;

/* ── Paso 3: Éxito ── */
const PagoExito = styled.div`
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 16px; padding: 8px 0;
    text-align: center; position: relative;
`;
const ConfettiCenter = styled.div`
    position: fixed; top: 30%; left: 50%; transform: translateX(-50%);
    pointer-events: none; z-index: 9999;
`;
const CheckCircle = styled.div`
    width: 80px; height: 80px; border-radius: 50%;
    background: ${({ $color }) => `${$color}18`};
    border: 3px solid ${({ $color }) => $color};
    box-shadow: 0 0 40px ${({ $glow }) => $glow}, 0 0 12px ${({ $glow }) => $glow};
    display: flex; align-items: center; justify-content: center;
    color: ${({ $color }) => $color}; font-size: 44px;
    animation: ${checkPop} 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards;
    margin-top: 8px;
`;
const ExitoTitle = styled.h2`
    font-size: 22px; font-weight: 900; color: #fff;
    margin: 0; letter-spacing: -0.3px;
    animation: ${slideCard} 0.5s 0.2s ease both;
`;
const ExitoSub = styled.p`
    font-size: 14px; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.5;
    animation: ${slideCard} 0.5s 0.3s ease both;
`;
const ExitoPlanCard = styled.div`
    width: 100%; border-radius: 18px; padding: 18px;
    background: ${({ $color }) => `${$color}10`};
    border: 1.5px solid ${({ $color }) => `${$color}30`};
    box-shadow: 0 0 32px ${({ $glow }) => $glow};
    display: flex; flex-direction: column; gap: 14px;
    animation: ${slideCard} 0.5s 0.4s ease both;
`;
const ExitoPlanHeader = styled.div`
    display: flex; align-items: center; gap: 12px;
`;
const ExitoPlanEmoji = styled.span`
    font-size: 32px;
`;
const ExitoPlanNombre = styled.span`
    display: block; font-size: 17px; font-weight: 900;
    color: ${({ $color }) => $color};
`;
const ExitoPlanPrecio = styled.span`
    display: block; font-size: 12px; color: rgba(255,255,255,0.38);
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
`;
const ExitoFeatures = styled.ul`
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 8px;
`;
const ExitoFeatureRow = styled.li`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75);
    svg { color: ${({ $color }) => $color}; font-size: 15px; flex-shrink: 0; }
`;
const ExitoNota = styled.p`
    font-size: 12px; color: rgba(255,255,255,0.3); margin: 0;
    display: flex; align-items: center; gap: 5px;
    svg { font-size: 14px; }
    b { color: rgba(255,255,255,0.5); }
    animation: ${slideCard} 0.5s 0.6s ease both;
`;

/* ── Éxito del formulario de registro ── */
const RegExitoWrap = styled.div`
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; padding: 12px 0; text-align: center;
    position: relative;
`;
const RegExitoCirculo = styled.div`
    font-size: 64px; line-height: 1;
    animation: ${checkPop} 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards;
`;
