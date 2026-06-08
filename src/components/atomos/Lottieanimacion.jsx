import Lottie from "lottie-react";

export function Lottieanimacion({ alto, ancho, animacion }) {
    return (
        <Lottie
            animationData={animacion}
            loop
            autoplay
            style={{ height: `${alto}px`, width: `${ancho}px` }}
        />
    );
}
