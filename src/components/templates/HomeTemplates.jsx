import styled from "styled-components";
import { UserAuth } from "../../context/AuthContent"
export function HomeTemplates () {
    const { signOut } = UserAuth();
    return (<Container>
        <span>Home Templates</span>
        <button onClick={signOut}>Cerrar</button>
    </Container>
    );
}
const Container =styled.div`
    height: 100vh;
`
