import Adsense from './Adsense';

interface AdBannerProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AdBanner({ className, style }: AdBannerProps) {
  return (
    <div className={className}>
      <Adsense
        adSlot="9334852581"
        style={style}
      />
    </div>
  );
}