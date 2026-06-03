import styled from "styled-components";
import { Btn1 } from "../moleculas/Btn1";
import { Footer } from "../organismos/Footer";
import { InputText2 } from "../organismos/formularios/InputText2";
import { Linea } from "../atomos/Linea";
import { Title } from "../atomos/Title";
import { useAuthStore } from "../../store/AuthStore";
import {v} from "../../styles/variables"
import {Device} from "../../styles/breakpoints"
export function LoginTemplate () {
    const {loginGoogle} = useAuthStore();
    return (<Container>
            <div className="card">
                <ContentLogo>
                    <img src={v.logo}/>
                    <span>POS DL v1</span>
                </ContentLogo>
                <Title $paddingbottom="10px">Ingresar</Title>
                <form>
                    <InputText2>
                    <input className="form__field" placeholder="email" type="text"/>
                    </InputText2>
                    <InputText2>
                    <input className="form__field" placeholder="contraseña" type="password"/>
                    </InputText2>
                    <Btn1 titulo="INGRESAR" bgcolor="#1cb0f6" color="255,255,255" width="100%"/>
                </form>
                <Linea>
                    <span>0</span>
                </Linea>
                <Btn1 titulo="Google" bgcolor="#fff" icono={<v.iconogoogle/>} funcion={loginGoogle} width="100%"/>
            </div>
             <Footer/>
    </Container>
    );
}
const Container =styled.div`
    height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    text-align: center;
    flex-direction: column;
    padding:0 10px;
    color:${({theme})=>theme.text};
        .card{
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
            width: 100%;
            margin: 20px;
            @media ${Device.tablet} {
                width: 400px; 
            }
        }
`;
const ContentLogo = styled.section`
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px;
    span {
        font-weight: 700;
    }
    img {
        width: 9%;
        padding: 0 5px;
    }
`;
