import { useEffect, useCallback, useRef, useState } from "react";

export type MotionPermissionStatus = 'unknown' | 'granted' | 'denied' | 'not-supported';

const PERMISSION_STORAGE_KEY = 'shake_motion_permission';

interface UseShakeDetectionOptions {
  threshold?: number; // Acceleration threshold to detect shake
  timeout?: number; // Time window for shake detection (ms)
  onShake: () => void;
  enabled?: boolean;
}

interface UseShakeDetectionReturn {
  permissionStatus: MotionPermissionStatus;
  requestPermission: () => Promise<boolean>;
  isListening: boolean;
  isSupported: boolean;
}

export const useShakeDetection = ({
  threshold = 15,
  timeout = 1000,
  onShake,
  enabled = true,
}: UseShakeDetectionOptions): UseShakeDetectionReturn => {
  const [permissionStatus, setPermissionStatus] = useState<MotionPermissionStatus>('unknown');
  const [isListening, setIsListening] = useState(false);
  const lastShakeTime = useRef<number>(0);
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const lastZ = useRef<number | null>(null);

  // Check if DeviceMotionEvent is supported
  const isSupported = typeof window !== 'undefined' && typeof DeviceMotionEvent !== 'undefined';

  // Check if iOS requires permission
  const requiresPermission = isSupported && 
    typeof (DeviceMotionEvent as any).requestPermission === 'function';

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

        const totalAcceleration = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

        if (totalAcceleration > threshold) {
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

  // Start listening when permission is granted and enabled
  useEffect(() => {
    if (!isSupported) {
      setPermissionStatus('not-supported');
      return;
    }

    // Check localStorage for cached permission status
    const cachedPermission = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (cachedPermission === 'granted') {
      setPermissionStatus('granted');
    } else if (cachedPermission === 'denied') {
      setPermissionStatus('denied');
    } else if (!requiresPermission) {
      // Non-iOS devices don't need permission
      setPermissionStatus('granted');
    }
  }, [isSupported, requiresPermission]);

  // Add/remove motion listener based on permission and enabled state
  useEffect(() => {
    if (!isSupported || permissionStatus !== 'granted' || !enabled) {
      setIsListening(false);
      return;
    }

    window.addEventListener('devicemotion', handleMotion);
    setIsListening(true);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      setIsListening(false);
    };
  }, [isSupported, permissionStatus, enabled, handleMotion]);

  // Request permission function - MUST be called from user gesture on iOS
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setPermissionStatus('not-supported');
      return false;
    }

    if (requiresPermission) {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionStatus('granted');
          localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
          return true;
        } else {
          setPermissionStatus('denied');
          localStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
          return false;
        }
      } catch (error) {
        console.error('Error requesting DeviceMotion permission:', error);
        setPermissionStatus('denied');
        return false;
      }
    }

    // Non-iOS devices - permission granted automatically
    setPermissionStatus('granted');
    localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
    return true;
  }, [isSupported, requiresPermission]);

  return { 
    permissionStatus, 
    requestPermission, 
    isListening,
    isSupported 
  };
};
