import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DiaryRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/diary/${today}`, { replace: true });
  }, [navigate]);

  return null;
};

export default DiaryRedirect;
