import { useEffect, useState } from 'react';
import { initDatabase } from '../services/databaseService';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    initDatabase()
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch((initError: Error) => {
        if (isMounted) {
          setError(initError.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { isReady, error };
}
