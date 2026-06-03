import styled from "styled-components";
import {SyncLoader} from "react-spinners"
export function Spinner1 () {
    return (<Container>
<SyncLoader color="#7f3ceb" size={30}/>
    </Container>);
}
const Container =styled.div`
    display:flex;
    justify-content: center;
    align-items: center;
    height:100vh;
`