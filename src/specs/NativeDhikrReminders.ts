import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type Reminder = {
  id: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
};
export type ReminderSettings = {
  enabledIds: string[];
  authorizationStatus: string;
  precise: boolean;
};
export interface Spec extends TurboModule {
  configure(reminders: Reminder[]): Promise<ReminderSettings>;
  setEnabledIds(ids: string[]): Promise<ReminderSettings>;
  requestPermission(): Promise<ReminderSettings>;
  openSettings(preciseAlarms: boolean): Promise<void>;
  sendTest(): Promise<void>;
}
export default TurboModuleRegistry.get<Spec>('NativeDhikrReminders');
