import styled from "styled-components";
import { GiPadlock } from "react-icons/gi";
export function Footer() {
  return (
    <Container>
      <section className="lock">
        <GiPadlock />
        <span>
          Esta es una página segura de ADMA BI. Si tienes dudas sobre la
          autenticidad de la web, comunícate con
          <br /> nosotros al 311 830 3017 solo por WhatsApp.
        </span>
      </section>
      <section className="derechos">
        <span>ADMA BI</span>
        <div className="separador"></div>
        <span>Todos los derechos reservados</span>
        <div className="separador"></div>
        <span>© 2026 adma.bi</span>
      </section>
    </Container>
  );
}
const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12.2px;
  color: ${({ theme }) => theme.colorSubtitle ?? "#91a4b7"};
  gap:5px;
  margin:10px;
  .lock {
    border-bottom: 1px solid rgba(145, 164, 183,0.3);
    gap: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-bottom: 6px;
  }
  .derechos {
    display: flex;
    justify-content: center;
    gap: 16px;
   .separador{
    width:1px;
    background-color:rgba(145, 164, 183,0.3);
    margin-top:4px;
    height:80%;
    align-items:center;
    display:flex;
   }
    span{
      margin-top:5px;
    }
  }
`;