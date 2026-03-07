import { useEffect, useMemo, useState } from 'react';

const getSize = () => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  height: typeof window !== 'undefined' ? window.innerHeight : 768
});

export const useWindowSize = (breakpoint = 768) => {
  const [size, setSize] = useState(getSize);

  useEffect(() => {
    const onResize = () => setSize(getSize());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const isMobile = useMemo(() => size.width < breakpoint, [size.width, breakpoint]);

  return { ...size, isMobile };
};

