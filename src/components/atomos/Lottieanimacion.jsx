import { useLottie } from "lottie-react";

export function Lottieanimacion({ alto, ancho, animacion }) {
    const { View } = useLottie(
        { animationData: animacion, loop: true, autoplay: true },
        { height: `${alto}px`, width: `${ancho}px` }
    );
    return View;
}
