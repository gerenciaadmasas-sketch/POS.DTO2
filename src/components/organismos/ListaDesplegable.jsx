import styled from "styled-components";
import { RiCloseLine } from "react-icons/ri";

export function ListaDesplegable({ data, setState, funcion, scroll, top, state }) {
  if (!state) return;
  function seleccionar(p) {
    funcion(p);
    setState();
  }
  return (
    <Container $top={top}>
      <Header onClick={setState}>
        <RiCloseLine />
      </Header>
      <Items $scroll={scroll}>
        {data?.map((item, index) => (
          <Item key={index} onClick={() => seleccionar(item)}>
            <Dot />
            <span>{item?.nombre ?? item?.razon_social}</span>
          </Item>
        ))}
        {(!data || data.length === 0) && (
          <Empty>Sin opciones</Empty>
        )}
      </Items>
    </Container>
  );
}

const Container = styled.div`
  position: absolute;
  top: ${({ $top }) => $top ?? "3rem"};
  width: 100%;
  background: ${({ theme }) => theme.bgcards};
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 14px;
  padding: 8px;
  z-index: 10;
  box-shadow: 0 8px 28px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
`;

const Header = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 2px 4px;
  cursor: pointer;
  font-size: 18px;
  color: ${({ theme }) => theme.colorsubtitlecard};
  &:hover { color: #f87171; }
`;

const Items = styled.div`
  overflow-y: ${({ $scroll }) => $scroll ?? "auto"};
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #f88533; border-radius: 10px; }
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.bgtotal};
  }
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f88533;
  flex-shrink: 0;
`;

const Empty = styled.div`
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: ${({ theme }) => theme.colorsubtitlecard};
`;
