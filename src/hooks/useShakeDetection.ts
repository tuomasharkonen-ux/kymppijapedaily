import { useEffect, useCallback, useRef } from "react";

interface UseShakeDetectionOptions {
  threshold?: number; // Acceleration threshold to detect shake
  timeout?: number; // Time window for shake detection (ms)
  onShake: () => void;
  enabled?: boolean;
}

export const useShakeDetection = ({
  threshold = 15,
  timeout = 1000,
  onShake,
  enabled = true,
}: UseShakeDetectionOptions) => {
  const lastShakeTime = useRef<number>(0);
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const lastZ = useRef<number | null>(null);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!enabled) return;

      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;

      if (lastX.current !== null && lastY.current !== null && lastZ.current !== null) {
        const deltaX = Math.abs(x - lastX.current);
        const deltaY = Math.abs(y - lastY.current);
        const deltaZ = Math.abs(z - lastZ.current);

        const acceleration = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

        if (acceleration > threshold) {
          const now = Date.now();
          if (now - lastShakeTime.current > timeout) {
            lastShakeTime.current = now;
            onShake();
          }
        }
      }

      lastX.current = x;
      lastY.current = y;
      lastZ.current = z;
    },
    [enabled, threshold, timeout, onShake]
  );

  useEffect(() => {
    if (!enabled) return;

    // Check if DeviceMotionEvent is available
    if (typeof DeviceMotionEvent === "undefined") {
      console.log("DeviceMotionEvent not supported");
      return;
    }

    // For iOS 13+, we need to request permission
    const requestPermission = async () => {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        } catch (error) {
          console.error("Error requesting DeviceMotion permission:", error);
        }
      } else {
        // Non-iOS or older iOS - just add listener
        window.addEventListener("devicemotion", handleMotion);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [enabled, handleMotion]);

  // Function to request permission (for iOS, must be called from user gesture)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === "granted";
      } catch (error) {
        console.error("Error requesting DeviceMotion permission:", error);
        return false;
      }
    }
    // Permission not needed on non-iOS devices
    return true;
  }, []);

  return { requestPermission };
};
