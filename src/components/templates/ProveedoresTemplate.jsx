import styled, { keyframes } from "styled-components";
import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { RiDeleteBin2Line } from "react-icons/ri";
import { useProveedoresStore } from "../../store/ProveedoresStore";
import { RegistrarProveedor } from "../organismos/formularios/RegistrarProveedor";
import { confirmar } from "../../utils/toast";

const FILTROS = [
    { key: "todos",  label: "Todos"   },
    { key: "nit",    label: "NIT"     },
    { key: "cedula", label: "Cédula"  },
];

export function ProveedoresTemplate() {
    const { dataproveedores, eliminarProveedor } = useProveedoresStore();
    const [openRegistro, setOpenRegistro] = useState(false);
    const [accion, setAccion]             = useState("Nuevo");
    const [dataSelect, setDataSelect]     = useState(null);
    const [buscar, setBuscar]             = useState("");
    const [filtro, setFiltro]             = useState("todos");

    const lista = useMemo(() => {
        if (!dataproveedores) return [];
        let r = dataproveedores;
        if (filtro !== "todos") r = r.filter(p => (p.tipo_documento ?? "nit") === filtro);
        if (buscar.trim()) {
            const q = buscar.toLowerCase();
            r = r.filter(p =>
                p.nombre?.toLowerCase().includes(q) ||
                p.nit?.toLowerCase().includes(q) ||
                p.contacto?.toLowerCase().includes(q) ||
                p.telefono?.includes(q)
            );
        }
        return r;
    }, [dataproveedores, filtro, buscar]);

    const totalNit    = (dataproveedores ?? []).filter(p => (p.tipo_documento ?? "nit") === "nit").length;
    const totalCedula = (dataproveedores ?? []).filter(p => p.tipo_documento === "cedula").length;

    function abrirNuevo() {
        setAccion("Nuevo");
        setDataSelect(null);
        setOpenRegistro(true);
    }

    function abrirEditar(p) {
        setAccion("Editar");
        setDataSelect(p);
        setOpenRegistro(true);
    }

    function doEliminar(p) {
        confirmar({
            titulo: "¿Eliminar proveedor?",
            texto: `Se eliminará "${p.nombre}". ¡Esta acción no se puede deshacer!`,
            onConfirmar: () => eliminarProveedor({ id: p.id, id_empresa: p.id_empresa }),
        });
    }

    return (
        <Wrap>
            {openRegistro && (
                <RegistrarProveedor
                    onClose={() => setOpenRegistro(false)}
                    dataSelect={dataSelect}
                    accion={accion}
                />
            )}

            {/* Header */}
            <Header>
                <HeaderLeft>
                    <PageIcon><Icon icon="solar:shop-bold-duotone" /></PageIcon>
                    <div>
                        <h1>Proveedores</h1>
                        <p>{(dataproveedores ?? []).length} registrados</p>
                    </div>
                </HeaderLeft>
                <Stats>
                    <Stat>
                        <Icon icon="solar:buildings-bold-duotone" />
                        <span>{totalNit}</span>
                        <label>NIT</label>
                    </Stat>
                    <StatDiv />
                    <Stat>
                        <Icon icon="solar:card-bold-duotone" />
                        <span>{totalCedula}</span>
                        <label>Cédula</label>
                    </Stat>
                </Stats>
                <NuevoBtn onClick={abrirNuevo}>
                    <Icon icon="solar:add-circle-bold-duotone" />
                    Nuevo proveedor
                </NuevoBtn>
            </Header>

            {/* Controles */}
            <Controls>
                <SearchWrap>
                    <Icon icon="solar:magnifier-bold-duotone" />
                    <input
                        placeholder="Buscar por nombre, NIT, contacto…"
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
                    <Icon icon="solar:shop-bold-duotone" />
                    <p>{buscar || filtro !== "todos" ? "Sin resultados" : "Aún no hay proveedores registrados"}</p>
                </Empty>
            ) : (
                <Grid>
                    {lista.map(p => {
                        const esNit = (p.tipo_documento ?? "nit") === "nit";
                        return (
                            <Card key={p.id}>
                                <CardTop>
                                    <DocBadge $nit={esNit}>
                                        <Icon icon={esNit ? "solar:buildings-bold-duotone" : "solar:card-bold-duotone"} />
                                        {esNit ? "NIT" : "Cédula"}
                                    </DocBadge>
                                    <CardActions>
                                        <ActBtn $edit onClick={() => abrirEditar(p)} title="Editar">
                                            <Icon icon="solar:pen-bold-duotone" />
                                        </ActBtn>
                                        <ActBtn onClick={() => doEliminar(p)} title="Eliminar">
                                            <RiDeleteBin2Line />
                                        </ActBtn>
                                    </CardActions>
                                </CardTop>

                                <CardName>{p.nombre}</CardName>
                                <CardDoc>{p.nit ?? "—"}</CardDoc>

                                <CardMeta>
                                    {p.contacto && (
                                        <MetaRow>
                                            <Icon icon="solar:user-bold-duotone" />
                                            <span>{p.contacto}</span>
                                        </MetaRow>
                                    )}
                                    {p.telefono && (
                                        <MetaRow>
                                            <Icon icon="solar:phone-bold-duotone" />
                                            <span>{p.telefono}</span>
                                        </MetaRow>
                                    )}
                                    {p.email && (
                                        <MetaRow>
                                            <Icon icon="solar:letter-bold-duotone" />
                                            <span>{p.email}</span>
                                        </MetaRow>
                                    )}
                                    {p.direccion && (
                                        <MetaRow>
                                            <Icon icon="solar:map-point-bold-duotone" />
                                            <span>{p.direccion}</span>
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

const fadeIn  = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;

const Wrap = styled.div`
    min-height: 100vh;
    padding: 28px 28px 40px;
    background: ${({ theme }) => theme.bgtotal};
    display: flex;
    flex-direction: column;
    gap: 20px;
    @media (max-width: 767px) { padding: 72px 14px 32px; }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    @media (max-width: 600px) { gap: 12px; }
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    h1 { font-size: 20px; font-weight: 800; color: ${({ theme }) => theme.text}; margin: 0; }
    p  { font-size: 12px; color: rgba(255,255,255,.35); margin: 0; }
`;

const PageIcon = styled.div`
    width: 46px; height: 46px;
    border-radius: 14px;
    background: rgba(248,133,51,.15);
    border: 1px solid rgba(248,133,51,.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: #f88533; flex-shrink: 0;
`;

const Stats = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 14px;
    padding: 10px 18px;
`;

const Stat = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    svg { font-size: 16px; color: rgba(255,255,255,.4); }
    span { font-size: 18px; font-weight: 800; color: #fff; }
    label { font-size: 11px; color: rgba(255,255,255,.3); }
`;

const StatDiv = styled.div`
    width: 1px; height: 28px;
    background: rgba(255,255,255,.1);
`;

const NuevoBtn = styled.button`
    display: flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #f88533, #f59e0b);
    color: #fff; border: none; border-radius: 12px;
    padding: 11px 18px;
    font-size: 13px; font-weight: 700;
    font-family: "Poppins", sans-serif;
    cursor: pointer; white-space: nowrap;
    transition: .15s;
    svg { font-size: 18px; }
    &:hover { opacity: .9; transform: translateY(-1px); }
`;

const Controls = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
`;

const SearchWrap = styled.div`
    flex: 1; min-width: 220px;
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 0 12px;
    svg { font-size: 18px; color: rgba(255,255,255,.3); flex-shrink: 0; }
    input {
        flex: 1; background: transparent; border: none; outline: none;
        color: #fff; font-size: 13px; font-family: "Poppins", sans-serif;
        padding: 10px 0;
        &::placeholder { color: rgba(255,255,255,.2); }
    }
`;

const ClearBtn = styled.button`
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,.3); font-size: 16px;
    display: flex; align-items: center;
    &:hover { color: #f87171; }
`;

const Chips = styled.div`
    display: flex; gap: 6px;
`;

const Chip = styled.button`
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid ${p => p.$active ? "#f88533" : "rgba(255,255,255,.1)"};
    background: ${p => p.$active ? "rgba(248,133,51,.15)" : "rgba(255,255,255,.04)"};
    color: ${p => p.$active ? "#f88533" : "rgba(255,255,255,.4)"};
    font-size: 12px; font-weight: 700; font-family: "Poppins", sans-serif;
    cursor: pointer; transition: .15s;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
    animation: ${fadeIn} .3s ease;
    @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 18px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color .2s, transform .2s;
    &:hover {
        border-color: rgba(248,133,51,.3);
        transform: translateY(-2px);
    }
`;

const CardTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const DocBadge = styled.div`
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    border-radius: 8px;
    background: ${p => p.$nit ? "rgba(96,165,250,.12)" : "rgba(52,211,153,.12)"};
    border: 1px solid ${p => p.$nit ? "rgba(96,165,250,.3)" : "rgba(52,211,153,.3)"};
    color: ${p => p.$nit ? "#60a5fa" : "#34d399"};
    font-size: 11px; font-weight: 700;
    svg { font-size: 13px; }
`;

const CardActions = styled.div`
    display: flex; gap: 6px;
`;

const ActBtn = styled.button`
    width: 30px; height: 30px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.05);
    color: ${p => p.$edit ? "rgba(255,255,255,.5)" : "rgba(248,113,113,.6)"};
    font-size: 15px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: .15s;
    &:hover {
        background: ${p => p.$edit ? "rgba(248,133,51,.12)" : "rgba(248,113,113,.12)"};
        color: ${p => p.$edit ? "#f88533" : "#f87171"};
        border-color: ${p => p.$edit ? "rgba(248,133,51,.3)" : "rgba(248,113,113,.3)"};
    }
`;

const CardName = styled.p`
    font-size: 15px; font-weight: 800; color: #fff; margin: 0;
`;

const CardDoc = styled.p`
    font-size: 12px; color: rgba(255,255,255,.4); margin: 0;
    font-family: monospace;
`;

const CardMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,.06);
`;

const MetaRow = styled.div`
    display: flex; align-items: center; gap: 7px;
    svg { font-size: 13px; color: rgba(255,255,255,.3); flex-shrink: 0; }
    span { font-size: 12px; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const Empty = styled.div`
    flex: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px;
    svg { font-size: 64px; color: rgba(255,255,255,.1); }
    p { font-size: 14px; color: rgba(255,255,255,.25); margin: 0; }
`;
