import { useEffect, useState } from 'react';

// An <img> that shows a neutral placeholder when the image is missing or the link is broken.
export default function SafeImage({ src, alt, ...rest }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return <img src={failed || !src ? '/placeholder.svg' : src} alt={alt} loading="lazy" onError={() => setFailed(true)} {...rest} />;
}
