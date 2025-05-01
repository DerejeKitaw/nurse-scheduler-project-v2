import * as React from 'react';
import { createContext, useContext, useState } from 'react';
import { ScheduleState } from '../ChatBox/types';



interface ScheduleContextProps {
  scheduleState: ScheduleState;
  setScheduleState: React.Dispatch<React.SetStateAction<ScheduleState>>;
  resetScheduleState: () => void;
}

const ScheduleContext = createContext<ScheduleContextProps | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scheduleState, setScheduleState] = useState<ScheduleState>({
    isResolved: true,
    confirmationPending: false,
  });

  const resetScheduleState = () => {
    setScheduleState({
      isResolved: true,
      confirmationPending: false,
    });
  };

  return (
    <ScheduleContext.Provider value={{ scheduleState, setScheduleState, resetScheduleState }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useScheduleContext = (): ScheduleContextProps => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useScheduleContext must be used within a ScheduleProvider');
  }
  return context;
};
