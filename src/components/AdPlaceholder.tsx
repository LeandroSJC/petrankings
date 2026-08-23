import React from 'react';
import AdSenseUnit, { AdSenseUnitProps } from './AdSenseUnit';

interface AdPlaceholderProps extends AdSenseUnitProps {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AdPlaceholder conectado ao motor AdSenseUnit.
 * Mantém compatibilidade total com os blocos já existentes no projeto.
 */
export default function AdPlaceholder({
  label = 'Publicidade Reservada',
  className = '',
  style = {},
  slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP,
  minHeight = '90px',
  ...rest
}: AdPlaceholderProps) {
  return (
    <AdSenseUnit
      label={label}
      className={className}
      style={style}
      slotId={slotId}
      minHeight={minHeight}
      {...rest}
    />
  );
}
