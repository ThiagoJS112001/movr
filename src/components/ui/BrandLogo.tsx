import { useState } from 'react';
import MovrLogo from './MovrLogo';

/** Logo da marca com fallback para SVG caso a imagem não exista. */
export default function BrandLogo({ size = 38 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);
  if (!imgError) {
    return (
      <img
        src="/images/logo_escura.png"
        alt="Movr"
        width={size}
        height={size}
        className="object-contain"
        onError={() => setImgError(true)}
      />
    );
  }
  return <MovrLogo size={size} withContainer />;
}
