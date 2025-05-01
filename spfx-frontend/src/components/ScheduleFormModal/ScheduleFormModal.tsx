import * as React from 'react';
import { useState, useEffect } from 'react';
import styles from './ScheduleFormModal.module.scss';

interface ScheduleFormModalProps {
  intent: 'schedule' | 'check' | 'swap' | 'cancel';
  onSubmit: (formData: {
    shiftDate: string;
    shiftType: string;
    workHours: number;
    text: string;
    intent: string;
  }) => void;
  onClose: () => void;
}

const intentTitles: Record<ScheduleFormModalProps['intent'], string> = {
  schedule: '📅 Schedule Shift',
  check: '👀 Check Availability',
  swap: '🔄 Swap Shift',
  cancel: '❌ Cancel Shift'
};

const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({ intent, onSubmit, onClose }) => {
  const [shiftDate, setShiftDate] = useState('');
  const [shiftType, setShiftType] = useState('Morning');
  const [workHours, setWorkHours] = useState(8);
  const [animateClass, setAnimateClass] = useState(styles.enter);

  useEffect(() => {
    setAnimateClass(styles.enter);
    return () => setAnimateClass(styles.exit);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `${intent} - ${shiftType} on ${shiftDate}`;
    onSubmit({ shiftDate, shiftType, workHours, text, intent });
    onClose();
  };

  const showShiftType = ['schedule', 'swap'].includes(intent);
  const showWorkHours = intent === 'schedule';

  return (
    <div className={`${styles.modalOverlay} ${animateClass}`}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{intentTitles[intent]}</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={styles.modalLabel}>
            Shift Date:
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              required
              className={styles.modalInput}
            />
          </label>

          {showShiftType && (
            <label className={styles.modalLabel}>
              Shift Type:
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </label>
          )}

          {showWorkHours && (
            <label className={styles.modalLabel}>
              Work Hours:
              <input
                type="number"
                value={workHours}
                onChange={(e) => setWorkHours(Number(e.target.value))}
                min={1}
                required
                className={styles.modalInput}
              />
            </label>
          )}

          <div className={styles.modalButtons}>
            <button type="submit" className={styles.submitButton}>Submit</button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleFormModal;
