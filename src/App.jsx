import styled, { ThemeProvider, keyframes } from "styled-components";
import { AuthContextProvider } from "./context/AuthContent";
import { GlobalStyles } from "./styles/GlobalStyles";
import { Myroutes } from "./routers/routes";
import { useThemeStore } from "./store/ThemeStore";
import { Device } from "./styles/breakpoints";
import { Sidebar } from "./components/organismos/sidebar/Sidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { blurin } from "./styles/keyframes";
import { RiMenuLine, RiCloseLine } from "react-icons/ri";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { themeStyle } = useThemeStore();
  const { pathname } = useLocation();
  const isLoginRoute = pathname === "/login";

  return (
    <ThemeProvider theme={themeStyle}>
      <AuthContextProvider>
        <GlobalStyles />
        {!isLoginRoute ? (
          <Container className={sidebarOpen ? "active" : ""}>
            <section className="contentSidebar">
              <Sidebar
                state={sidebarOpen}
                setState={() => setSidebarOpen(!sidebarOpen)}
                onNavClick={() => setSidebarOpen(false)}
              />
            </section>
            <section className="contentRouters">
              <PageWrapper key={pathname}><Myroutes /></PageWrapper>
            </section>

            {/* Botón hamburger — solo visible en móvil */}
            <HamburgerBtn onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <RiCloseLine /> : <RiMenuLine />}
            </HamburgerBtn>

            {/* Overlay oscuro al abrir en móvil */}
            {sidebarOpen && (
              <MobileOverlay onClick={() => setSidebarOpen(false)} />
            )}
          </Container>
        ) : (
          <Myroutes />
        )}
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthContextProvider>
    </ThemeProvider>
  );
}

const Container = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  transition: 0.1s ease-in-out;
  color: ${({ theme }) => theme.text};

  .contentSidebar {
    /* En móvil: ocupa 0 espacio pero el sidebar fixed sigue renderizándose */
    width: 0;
    overflow: visible;
    display: block;
  }

  .contentRouters {
    grid-column: 1;
    width: 100%;
    min-width: 0;
  }

  @media ${Device.tablet} {
    grid-template-columns: 88px 1fr;

    &.active {
      grid-template-columns: 260px 1fr;
    }

    .contentSidebar {
      width: auto;
      overflow: visible;
    }

    .contentRouters {
      grid-column: 2;
    }
  }
`;

const PageWrapper = styled.div`
  animation: ${blurin} 0.4s linear both;
`;

/* Botón hamburger — solo en móvil */
const HamburgerBtn = styled.button`
  position: fixed;
  top: 10px;
  left: 10px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #f88533 0%, #f56a00 100%);
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 200;
  box-shadow: 0 4px 18px rgba(248, 133, 51, 0.45);
  transition: transform 0.15s, box-shadow 0.15s;

  &:active {
    transform: scale(0.92);
    box-shadow: 0 2px 8px rgba(248, 133, 51, 0.3);
  }

  /* Ocultar en tablet+ donde el sidebar está siempre visible */
  @media ${Device.tablet} {
    display: none;
  }
`;

/* Overlay oscuro detrás del drawer en móvil */
const MobileOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 98;
  animation: fadeOverlay 0.2s ease;

  @keyframes fadeOverlay {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* No mostrar en tablet+ */
  @media ${Device.tablet} {
    display: none;
  }
`;

export default App;
