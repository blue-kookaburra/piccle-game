"use client";

import { useRef, useCallback } from "react";
import { useSpring } from "framer-motion";

interface DragState {
  prevAngle: number;
  accumulated: number;
  startIndex: number;
}

export function useCameraRing(
  values: (string | number)[],
  currentIndex: number,
  onChange: (i: number) => void,
  // centerX/centerY in SVG viewBox units — caller must convert to screen coords
  getCenterScreen: () => { x: number; y: number }
) {
  const n = values.length;
  const targetDeg = (currentIndex / n) * 360;

  const springDeg = useSpring(targetDeg, { stiffness: 400, damping: 40 });
  springDeg.set(targetDeg);

  const drag = useRef<DragState | null>(null);

  const getAngle = useCallback(
    (clientX: number, clientY: number) => {
      const { x, y } = getCenterScreen();
      return Math.atan2(clientY - y, clientX - x);
    },
    [getCenterScreen]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      drag.current = {
        prevAngle: getAngle(e.clientX, e.clientY),
        accumulated: 0,
        startIndex: currentIndex,
      };
    },
    [currentIndex, getAngle]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      const cur = getAngle(e.clientX, e.clientY);
      let delta = cur - drag.current.prevAngle;
      // Shortest-path wrap fix
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      drag.current.accumulated += delta;
      drag.current.prevAngle = cur;

      const degPerStep = (2 * Math.PI) / n;
      const idxDelta = Math.round(drag.current.accumulated / degPerStep);
      const next = Math.max(
        0,
        Math.min(n - 1, drag.current.startIndex + idxDelta)
      );
      if (next !== currentIndex) {
        onChange(next);
        navigator.vibrate?.(8);
      }
    },
    [currentIndex, getAngle, n, onChange]
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  // Mouse wheel support for desktop
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(n - 1, currentIndex + dir));
      if (next !== currentIndex) {
        onChange(next);
        navigator.vibrate?.(8);
      }
    },
    [currentIndex, n, onChange]
  );

  return {
    springDeg,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  };
}
