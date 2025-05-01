export interface ISchedulerAgentProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userEmail: string;
  userImageUrl?: string;
  userId?: number;
  aiAvatarOption: 'avatar1' | 'avatar2' | 'avatar3' | 'none';
  useAiAvatar: boolean;
  showScheduleFormModal?: () => void;

}
