import React from 'react';
import MemoryArchive from '../components/MemoryArchive/MemoryArchive';

const MemoryArchivePage = () => {
  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <MemoryArchive />
    </div>
  );
};

export default MemoryArchivePage;
