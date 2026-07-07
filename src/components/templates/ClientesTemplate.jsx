import styled, { keyframes } from "styled-components";
import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { RiDeleteBin2Line } from "react-icons/ri";
import { useClientesStore } from "../../store/ClientesStore";
import { RegistrarCliente } from "../organismos/formularios/RegistrarCliente";
import { confirmar } from "../../utils/toast";

const FILTROS = [
    { key: "todos",  label: "Todos"  },
    { key: "cc",     label: "CC"     },
    { key: "nit",    label: "NIT"    },
];

export function ClientesTemplate() {
    const { dataclientes, eliminarCliente } = useClientesStore();
    const [openRegistro, setOpenRegistro] = useState(false);
    const [accion, setAccion]             = useState("Nuevo");
    const [dataSelect, setDataSelect]     = useState(null);
    const [buscar, setBuscar]             = useState("");
    const [filtro, setFiltro]             = useState("todos");

    const lista = useMemo(() => {
        if (!dataclientes) return [];
        let r = dataclientes;
        if (filtro !== "todos") r = r.filter(c => (c.tipo_documento ?? "cc") === filtro);
        if (buscar.trim()) {
            const q = buscar.toLowerCase();
            r = r.filter(c =>
                c.nombre?.toLowerCase().includes(q) ||
                c.apellido?.toLowerCase().includes(q) ||
                c.documento?.toLowerCase().includes(q) ||
                c.telefono?.includes(q) ||
                c.email?.toLowerCase().includes(q)
            );
        }
        return r;
    }, [dataclientes, filtro, buscar]);

    const totalCC  = (dataclientes ?? []).filter(c => (c.tipo_documento ?? "cc") === "cc").length;
    const totalNIT = (dataclientes ?? []).filter(c => c.tipo_documento === "nit").length;

    function abrirNuevo() {
        setAccion("Nuevo"); setDataSelect(null); setOpenRegistro(true);
    }
    function abrirEditar(c) {
        setAccion("Editar"); setDataSelect(c); setOpenRegistro(true);
    }
    function doEliminar(c) {
        confirmar({
            titulo: "¿Eliminar cliente?",
            texto: `Se eliminará "${c.nombre}${c.apellido ? " " + c.apellido : ""}". ¡Esta acción no se puede deshacer!`,
            onConfirmar: () => eliminarCliente({ id: c.id, id_empresa: c.id_empresa }),
        });
    }

    return (
        <Wrap>
            {openRegistro && (
                <RegistrarCliente
                    onClose={() => setOpenRegistro(false)}
                    dataSelect={dataSelect}
                    accion={accion}
                />
            )}

            {/* Header */}
            <Header>
                <HeaderLeft>
                    <PageIcon><Icon icon="solar:users-group-rounded-bold-duotone" /></PageIcon>
                    <div>
                        <h1>Clientes</h1>
                        <p>{(dataclientes ?? []).length} registrados</p>
                    </div>
                </HeaderLeft>
                <Stats>
                    <Stat>
                        <Icon icon="solar:card-bold-duotone" />
                        <span>{totalCC}</span>
                        <label>CC</label>
                    </Stat>
                    <StatDiv />
                    <Stat>
                        <Icon icon="solar:buildings-bold-duotone" />
                        <span>{totalNIT}</span>
                        <label>NIT</label>
                    </Stat>
                </Stats>
                <NuevoBtn onClick={abrirNuevo}>
                    <Icon icon="solar:add-circle-bold-duotone" />
                    Nuevo cliente
                </NuevoBtn>
            </Header>

            {/* Controles */}
            <Controls>
                <SearchWrap>
                    <Icon icon="solar:magnifier-bold-duotone" />
                    <input
                        placeholder="Buscar por nombre, documento, teléfono…"
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                    />
                    {buscar && (
                        <ClearBtn onClick={() => setBuscar("")}>
                            <Icon icon="solar:close-circle-bold-duotone" />
                        </ClearBtn>
                    )}
                </SearchWrap>
                <Chips>
                    {FILTROS.map(f => (
                        <Chip key={f.key} $active={filtro === f.key} onClick={() => setFiltro(f.key)}>
                            {f.label}
                        </Chip>
                    ))}
                </Chips>
            </Controls>

            {/* Cards */}
            {lista.length === 0 ? (
                <Empty>
                    <Icon icon="solar:users-group-rounded-bold-duotone" />
                    <p>{buscar || filtro !== "todos" ? "Sin resultados" : "Aún no hay clientes registrados"}</p>
                </Empty>
            ) : (
                <Grid>
                    {lista.map(c => {
                        const esNit = c.tipo_documento === "nit";
                        const nombreCompleto = [c.nombre, c.apellido].filter(Boolean).join(" ");
                        return (
                            <Card key={c.id}>
                                <CardTop>
                                    <DocBadge $nit={esNit}>
                                        <Icon icon={esNit ? "solar:buildings-bold-duotone" : "solar:card-bold-duotone"} />
                                        {esNit ? "NIT" : "CC"}
                                    </DocBadge>
                                    <CardActions>
                                        <ActBtn $edit onClick={() => abrirEditar(c)} title="Editar">
                                            <Icon icon="solar:pen-bold-duotone" />
                                        </ActBtn>
                                        <ActBtn onClick={() => doEliminar(c)} title="Eliminar">
                                            <RiDeleteBin2Line />
                                        </ActBtn>
                                    </CardActions>
                                </CardTop>

                                <CardAvatar $nit={esNit}>
                                    {nombreCompleto.charAt(0).toUpperCase()}
                                </CardAvatar>

                                <CardName>{nombreCompleto || "Sin nombre"}</CardName>
                                {c.documento && <CardDoc>{c.documento}</CardDoc>}

                                <CardMeta>
                                    {c.telefono && (
                                        <MetaRow>
                                            <Icon icon="solar:phone-bold-duotone" />
                                            <span>{c.telefono}</span>
                                        </MetaRow>
                                    )}
                                    {c.email && (
                                        <MetaRow>
                                            <Icon icon="solar:letter-bold-duotone" />
                                            <span>{c.email}</span>
                                        </MetaRow>
                                    )}
                                </CardMeta>
                            </Card>
                        );
                    })}
                </Grid>
            )}
        </Wrap>
    );
}

const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;

const Wrap = styled.div`
    min-height: 100vh;
    padding: 28px 28px 40px;
    background: ${({ theme }) => theme.bgtotal};
    display: flex; flex-direction: column; gap: 20px;
    @media (max-width: 767px) { padding: 72px 14px 32px; }
`;

const Header = styled.div`display:flex;align-items:center;gap:16px;flex-wrap:wrap;@media(max-width:600px){gap:12px;}`;
const HeaderLeft = styled.div`
    display:flex;align-items:center;gap:12px;flex:1;
    h1{font-size:20px;font-weight:800;color:${({theme})=>theme.text};margin:0;}
    p{font-size:12px;color:rgba(255,255,255,.35);margin:0;}
`;
const PageIcon = styled.div`
    width:46px;height:46px;border-radius:14px;
    background:rgba(96,165,250,.15);border:1px solid rgba(96,165,250,.3);
    display:flex;align-items:center;justify-content:center;
    font-size:24px;color:#60a5fa;flex-shrink:0;
`;
const Stats = styled.div`
    display:flex;align-items:center;gap:16px;
    background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:14px;padding:10px 18px;
`;
const Stat = styled.div`
    display:flex;align-items:center;gap:6px;
    svg{font-size:16px;color:rgba(255,255,255,.4);}
    span{font-size:18px;font-weight:800;color:#fff;}
    label{font-size:11px;color:rgba(255,255,255,.3);}
`;
const StatDiv = styled.div`width:1px;height:28px;background:rgba(255,255,255,.1);`;
const NuevoBtn = styled.button`
    display:flex;align-items:center;gap:8px;
    background:linear-gradient(135deg,#60a5fa,#3b82f6);
    color:#fff;border:none;border-radius:12px;padding:11px 18px;
    font-size:13px;font-weight:700;font-family:"Poppins",sans-serif;
    cursor:pointer;white-space:nowrap;transition:.15s;
    svg{font-size:18px;}
    &:hover{opacity:.9;transform:translateY(-1px);}
`;

const Controls = styled.div`display:flex;align-items:center;gap:12px;flex-wrap:wrap;`;
const SearchWrap = styled.div`
    flex:1;min-width:220px;display:flex;align-items:center;gap:8px;
    background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
    border-radius:12px;padding:0 12px;
    svg{font-size:18px;color:rgba(255,255,255,.3);flex-shrink:0;}
    input{flex:1;background:transparent;border:none;outline:none;color:#fff;
        font-size:13px;font-family:"Poppins",sans-serif;padding:10px 0;
        &::placeholder{color:rgba(255,255,255,.2);}}
`;
const ClearBtn = styled.button`
    background:none;border:none;cursor:pointer;
    color:rgba(255,255,255,.3);font-size:16px;
    display:flex;align-items:center;
    &:hover{color:#f87171;}
`;
const Chips = styled.div`display:flex;gap:6px;`;
const Chip  = styled.button`
    padding:8px 16px;border-radius:10px;
    border:1px solid ${p=>p.$active?"#60a5fa":"rgba(255,255,255,.1)"};
    background:${p=>p.$active?"rgba(96,165,250,.15)":"rgba(255,255,255,.04)"};
    color:${p=>p.$active?"#60a5fa":"rgba(255,255,255,.4)"};
    font-size:12px;font-weight:700;font-family:"Poppins",sans-serif;
    cursor:pointer;transition:.15s;
    &:hover{border-color:#60a5fa;color:#60a5fa;}
`;

const Grid = styled.div`
    display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
    gap:14px;animation:${fadeIn} .3s ease;
    @media(max-width:480px){grid-template-columns:1fr;}
`;

const Card = styled.div`
    background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:8px;
    transition:border-color .2s,transform .2s;
    &:hover{border-color:rgba(96,165,250,.3);transform:translateY(-2px);}
`;
const CardTop = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const DocBadge = styled.div`
    display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:8px;
    background:${p=>p.$nit?"rgba(248,133,51,.12)":"rgba(96,165,250,.12)"};
    border:1px solid ${p=>p.$nit?"rgba(248,133,51,.3)":"rgba(96,165,250,.3)"};
    color:${p=>p.$nit?"#f88533":"#60a5fa"};font-size:11px;font-weight:700;
    svg{font-size:13px;}
`;
const CardActions = styled.div`display:flex;gap:6px;`;
const ActBtn = styled.button`
    width:30px;height:30px;border-radius:8px;
    border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);
    color:${p=>p.$edit?"rgba(255,255,255,.5)":"rgba(248,113,113,.6)"};
    font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:.15s;
    &:hover{
        background:${p=>p.$edit?"rgba(96,165,250,.12)":"rgba(248,113,113,.12)"};
        color:${p=>p.$edit?"#60a5fa":"#f87171"};
        border-color:${p=>p.$edit?"rgba(96,165,250,.3)":"rgba(248,113,113,.3)"};
    }
`;
const CardAvatar = styled.div`
    width:48px;height:48px;border-radius:14px;margin:4px 0 0;
    background:${p=>p.$nit?"rgba(248,133,51,.15)":"rgba(96,165,250,.15)"};
    border:1px solid ${p=>p.$nit?"rgba(248,133,51,.25)":"rgba(96,165,250,.25)"};
    color:${p=>p.$nit?"#f88533":"#60a5fa"};
    font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;
`;
const CardName = styled.p`font-size:15px;font-weight:800;color:#fff;margin:0;`;
const CardDoc  = styled.p`font-size:12px;color:rgba(255,255,255,.35);margin:0;font-family:monospace;`;
const CardMeta = styled.div`
    display:flex;flex-direction:column;gap:5px;margin-top:4px;
    padding-top:10px;border-top:1px solid rgba(255,255,255,.06);
`;
const MetaRow = styled.div`
    display:flex;align-items:center;gap:7px;
    svg{font-size:13px;color:rgba(255,255,255,.3);flex-shrink:0;}
    span{font-size:12px;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
`;
const Empty = styled.div`
    flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
    svg{font-size:64px;color:rgba(255,255,255,.1);}
    p{font-size:14px;color:rgba(255,255,255,.25);margin:0;}
`;
