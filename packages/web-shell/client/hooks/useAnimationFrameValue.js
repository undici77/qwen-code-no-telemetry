import { useEffect, useState } from 'react';
export function useAnimationFrameValue(value) {
  const [framedValue, setFramedValue] = useState(value);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFramedValue(value);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [value]);
  return framedValue;
}
//# sourceMappingURL=useAnimationFrameValue.js.map
