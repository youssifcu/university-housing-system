import React, { createContext, useContext, useMemo, useState } from 'react';

const AIChatContext = createContext(null);

export const AIChatProvider = ({ children }) => {
  const [screenContext, setScreenContext] = useState({});

  const value = useMemo(
    () => ({
      screenContext,
      setScreenContext,
    }),
    [screenContext]
  );

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
};

export const useAIChatContext = () => {
  const context = useContext(AIChatContext);

  if (!context) {
    throw new Error('useAIChatContext must be used inside AIChatProvider.');
  }

  return context;
};
