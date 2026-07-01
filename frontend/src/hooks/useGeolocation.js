import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

/**
 * Custom hook wrapping navigator.geolocation.watchPosition.
 *
 * @param {PositionOptions} options  Optional geolocation API options
 * @returns {{ position, error, permissionState, isWatching, stopWatching }}
 */
export function useGeolocation(options = DEFAULT_OPTIONS) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: -1, message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsWatching(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setPermissionState('granted');
        setError(null);
      },
      (err) => {
        setError({ code: err.code, message: err.message });
        if (err.code === 1) {
          setPermissionState('denied');
          setIsWatching(false);
        }
      },
      options
    );
  }, [options]);

  // Check permission state on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      });
    }
  }, []);

  // Start watching on mount
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  return { position, error, permissionState, isWatching, stopWatching, startWatching };
}
