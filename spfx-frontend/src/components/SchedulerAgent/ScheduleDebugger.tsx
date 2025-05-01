import * as React from 'react';
import { useScheduleContext } from '../SchedulerAgent/ScheduleContext';

const ScheduleDebugger: React.FC = () => {
  const { scheduleState } = useScheduleContext();

  const getStatusColor = () => {
    if (scheduleState.confirmationPending) return '#ffc107'; // Yellow
    if (!scheduleState.isResolved) return '#17a2b8'; // Blue
    return '#28a745'; // Green
  };

  const getStatusText = () => {
    if (scheduleState.confirmationPending) return '🔔 Waiting for user confirmation...';
    if (!scheduleState.isResolved) return '⏳ Collecting required info...';
    return '✅ Conversation complete';
  };

  return (
    <div style={{
      background: '#fff',
      padding: '1rem',
      marginTop: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      fontFamily: 'monospace'
    }}>
      <div style={{
        marginBottom: '0.5rem',
        fontWeight: 'bold',
        color: getStatusColor()
      }}>
        {getStatusText()}
      </div>
      <pre style={{
        background: '#f8f9fa',
        padding: '0.5rem',
        borderRadius: '6px',
        overflowX: 'auto',
        fontSize: '0.9rem'
      }}>
        {JSON.stringify(scheduleState, null, 2)}
      </pre>
    </div>
  );
};

export default ScheduleDebugger;
