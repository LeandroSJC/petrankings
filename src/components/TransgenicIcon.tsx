import React from 'react';

interface TransgenicIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Símbolo oficial regulatório brasileiro de alimento transgênico (Decreto nº 4.680/2003):
 * Triângulo equilátero com fundo amarelo, contorno preto e a letra 'T' maiúscula no centro.
 */
export default function TransgenicIcon({
  size = 14,
  className,
  style,
}: TransgenicIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      aria-label="Contém Transgênicos"
      role="img"
    >
      <title>Produto com ingredientes transgênicos (Selo Oficial T)</title>
      {/* Triângulo com cantos levemente suavizados */}
      <polygon
        points="12,2.2 22.8,20.8 1.2,20.8"
        fill="#FFD600"
        stroke="#111827"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Letra 'T' centralizada geométrica */}
      <path
        d="M6.5 7.5 H17.5 V10 H13.3 V18.5 H10.7 V10 H6.5 Z"
        fill="#111827"
      />
    </svg>
  );
}
