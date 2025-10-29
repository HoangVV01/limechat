'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdsenseProps {
  adSlot: string;
  adFormat?: string;
  style?: React.CSSProperties;
}

export default function Adsense({ adSlot, adFormat = 'auto', style }: AdsenseProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Error loading AdSense:', err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={style || { display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
}