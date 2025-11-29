import React from 'react';
import { CircularProgress } from '@mui/material';

const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#121212', // Match your app's dark background
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
    }}>
      <CircularProgress />
    </div>
  );
};

export default LoadingScreen;