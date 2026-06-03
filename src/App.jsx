import styled,{ThemeProvider} from "styled-components";
import { AuthContextProvider } from "./context/AuthContent";
import { GlobalStyles } from "./styles/GlobalStyles";
import { Myroutes } from "./routers/routes";
import { useThemeStore } from "./store/ThemeStore";
import {Device} from "./styles/breakpoints"
import { Sidebar } from "./components/organismos/sidebar/Sidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
function App() {
  const [sidebarOpen,setSidebarOpen] = useState (false);
  const {themeStyle} = useThemeStore();
  const {pathname} = useLocation ();
  const isLoginRoute = pathname === "/login";
  return (
    <ThemeProvider theme={themeStyle}>
    <AuthContextProvider>
      <GlobalStyles/>
      {
        !isLoginRoute?(<Container className={sidebarOpen?"active":""}>
      <section className="contentSidebar"><Sidebar state={sidebarOpen} setState={()=>setSidebarOpen(!sidebarOpen)}/></section>
      <section className="contentMenuambur">menu ambur</section>
      <section className="contentRouters"><Myroutes/></section>
    </Container>):(<Myroutes/>)
      }
      <ReactQueryDevtools initialIsOpen={true} />
    </AuthContextProvider>
    </ThemeProvider>
  )
}
const Container = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  transition: 0.1s ease-in-out;
  color:${({theme})=>theme.text};
  .contentSidebar{
    display: none;
    /*background-color: rgba(255, 255, 255, 0.5);*/
  }
  .contentMenuambur{
    position: absolute;
    /*background-color: rgba(126, 33, 126, 0.5);*/
  }
  .contentRouters{
   /* background-color: rgba(0, 0, 0, 0.5);*/
    grid-column: 1;
    width: 100%;
  }
  @media ${Device.tablet} {
    grid-template-columns:88px 1fr;
    &.active{
      grid-template-columns:260px 1fr;
    }
    .contentSidebar{
      display: initial;
    }
    .contentMenuambur{
    display: none;
    }
    .contentRouters{
    grid-column: 2;
    }
  }
`;
export default App
