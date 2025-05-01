import * as React from 'react';
import type { ISchedulerAgentProps } from './ISchedulerAgentProps';
import ChatBox from '../ChatBox/ChatBox';
import styles from './SchedulerAgent.module.scss';
import ScheduleFormModal from '../ScheduleFormModal/ScheduleFormModal';
import spListService from '../../services/sp/spListService';
import { CreateSchedulePayload } from '../../types/types';

type ModalMode = 'schedule' | 'check' | 'swap' | 'cancel';

interface SchedulerAgentState {
  showModal: boolean;
  modalMode: ModalMode;
  showPrompts: boolean;
}

export default class SchedulerAgent extends React.Component<ISchedulerAgentProps, SchedulerAgentState> {
  constructor(props: ISchedulerAgentProps) {
    super(props);
    this.state = {
      showModal: false,
      modalMode: 'schedule',
      showPrompts: false
    };
  }

  openModal = (mode: ModalMode) => {
    this.setState({ showModal: true, modalMode: mode });
  };

  closeModal = () => {
    this.setState({ showModal: false });
  };

  handleFormSubmit = async (formData: any): Promise<void> => {
    const { modalMode } = this.state;

    if (modalMode === 'schedule') {
      const item: CreateSchedulePayload = {
        ShiftStartDate: formData.shiftDate,
        ShiftEndDate: formData.shiftDate,
        ShiftType: formData.shiftType,
        WorkHours: formData.workHours,
        currentUserName: this.props.userEmail.split('@')[0],
        currentUserEmail: this.props.userEmail,
        userId: this.props.userId || 0,
      };

      await spListService.createScheduleItem(item);
    }

    this.setState({ showModal: false });
  };

  togglePrompts = (): void => {
    this.setState((prev) => ({ showPrompts: !prev.showPrompts }));
  };

  renderCard = (icon: string, title: string, desc: string, mode: ModalMode) => (
    <div className={styles.card} onClick={() => this.openModal(mode)}>
      <span className={styles.cardIcon}>{icon}</span>
      <div className={styles.cardContent}>
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
    </div>
  );

  public render(): React.ReactElement<ISchedulerAgentProps> {
    const {
      userEmail,
      userId,
      hasTeamsContext
    } = this.props;

    const userName = userEmail.split('@')[0];

    return (
      <section className={`${styles.schedulerAgent} ${hasTeamsContext ? styles.teams : ''}`}>
        <div className={styles.container}>
          <div className={styles.promptToggleWrapper}>
            <button onClick={this.togglePrompts} className={styles.promptToggleBtn}>
              {this.state.showPrompts ? 'Hide prompts' : 'View prompts'}
            </button>
          </div>

          {this.state.showPrompts && (
            <div className={styles.cardGrid}>
              {this.renderCard('🗓️', 'Schedule a Shift', 'Tell me when you’d like to work.', 'schedule')}
              {this.renderCard('👀', 'Check Availability', 'See if you’re free this weekend.', 'check')}
              {this.renderCard('🔄', 'Swap a Shift', 'Switch shifts with someone else.', 'swap')}
              {this.renderCard('❌', 'Cancel a Shift', 'Let me know which one to remove.', 'cancel')}
            </div>
          )}

          {userId !== undefined && (
            <ChatBox
              userCtx={{
                name: userName,
                email: userEmail,
                id: userId
              }}
            />
          )}


          {this.state.showModal && (
            <ScheduleFormModal
              intent={this.state.modalMode}
              onClose={this.closeModal}
              onSubmit={this.handleFormSubmit}
            />
          )}
        </div>
      </section>
    );
  }
}
