import styled, { ThemeProvider, keyframes } from "styled-components";
import { AuthContextProvider } from "./context/AuthContent";
import { GlobalStyles } from "./styles/GlobalStyles";
import { Myroutes } from "./routers/routes";
import { useThemeStore } from "./store/ThemeStore";
import { Device } from "./styles/breakpoints";
import { Sidebar } from "./components/organismos/sidebar/Sidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { blurin } from "./styles/keyframes";
import { RiMenuLine } from "react-icons/ri";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { themeStyle } = useThemeStore();
  const { pathname } = useLocation();
  const isLoginRoute = ["/login", "/", "/privacidad", "/terminos"].includes(pathname);

  return (
    <ThemeProvider theme={themeStyle}>
      <AuthContextProvider>
        <GlobalStyles />
        {!isLoginRoute ? (
          <>
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

            {/* Botón hamburger — solo visible en móvil cuando el sidebar está cerrado */}
            <HamburgerBtn $hidden={sidebarOpen} onClick={() => setSidebarOpen(true)}>
              <RiMenuLine />
            </HamburgerBtn>

            {/* Overlay oscuro al abrir en móvil */}
            {sidebarOpen && (
              <MobileOverlay onClick={() => setSidebarOpen(false)} />
            )}
          </Container>
          <BgOrb $x="-5%"  $y="-5%"  $c="rgba(248,133,51,0.18)" $s="700px" $dur="9s"  />
          <BgOrb $x="65%"  $y="12%"  $c="rgba(99,102,241,0.14)" $s="500px" $dur="11s" $delay="2s" />
          <BgOrb $x="25%"  $y="62%"  $c="rgba(52,211,153,0.10)" $s="450px" $dur="13s" $delay="4s" />
          <BgOrb $x="82%"  $y="72%"  $c="rgba(248,133,51,0.12)" $s="400px" $dur="8s"  $delay="1s" />
          <BgLines />
          </>
        ) : (
          <Myroutes />
        )}
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

/* Botón hamburger — solo en móvil, solo cuando sidebar está cerrado */
const HamburgerBtn = styled.button`
  position: fixed;
  top: 10px;
  left: 10px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(248, 133, 51, 0.35);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #f88533;
  font-size: 22px;
  display: ${({ $hidden }) => $hidden ? "none" : "flex"};
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 200;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s, background 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(248, 133, 51, 0.12);
    border-color: rgba(248, 133, 51, 0.6);
  }

  &:active {
    transform: scale(0.92);
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

/* ── Global background ── */
const floatOrb = keyframes`
    0%, 100% { transform: translate(0, 0)   scale(1); }
    33%       { transform: translate(30px, -20px) scale(1.08); }
    66%       { transform: translate(-20px, 15px) scale(0.95); }
`;

const BgOrb = styled.div`
    position: fixed;
    left:   ${({ $x }) => $x};
    top:    ${({ $y }) => $y};
    width:  ${({ $s }) => $s};
    height: ${({ $s }) => $s};
    border-radius: 50%;
    background: ${({ $c }) => $c};
    filter: blur(70px);
    pointer-events: none;
    z-index: 0;
    animation: ${floatOrb} ${({ $dur }) => $dur} ease-in-out infinite;
    animation-delay: ${({ $delay }) => $delay ?? "0s"};
`;

const BgLines = styled.div`
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
        linear-gradient(rgba(248,133,51,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(248,133,51,0.03) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%);
`;

export default App;
