import React from 'react';
import '../src/styles/globals.css';

function App({ Component, pageProps }: { Component: React.ComponentType, pageProps: any }) {
  return <Component {...pageProps} />;
}

export default App;
