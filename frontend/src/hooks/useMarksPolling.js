import { useState, useEffect, useRef } from 'react';
import { markAPI } from '../services/api';

const useMarksPolling = (studentId, interval = 30000) => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingRef = useRef(null);

  const fetchMarks = async () => {
    try {
      const response = await markAPI.getStudentMarks(studentId);
      if (response.data.success) {
        setMarks(response.data.data.marks || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!studentId) return;

    // Initial fetch
    fetchMarks();

    // Start polling
    pollingRef.current = setInterval(fetchMarks, interval);

    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [studentId, interval]);

  const refreshMarks = () => {
    fetchMarks();
  };

  return { marks, loading, lastUpdated, refreshMarks };
};

export default useMarksPolling;