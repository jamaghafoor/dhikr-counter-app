export const DHIKR_REMINDERS = [
  {
    id: 'morning-dhikr',
    hour: 6,
    minute: 0,
    title: 'Start Your Day with Dhikr 🌅',
    body: 'Begin your morning with the remembrance of Allah. SubhanAllah, Alhamdulillah, Allahu Akbar. 🤲',
  },
  {
    id: 'afternoon-dhikr',
    hour: 13,
    minute: 0,
    title: 'Take a Moment for Allah 📿',
    body: 'Pause your busy day and refresh your heart with Dhikr. A few moments of remembrance can bring peace.',
  },
  {
    id: 'evening-dhikr',
    hour: 18,
    minute: 0,
    title: 'Remember Allah This Evening 🌙',
    body: 'As the day winds down, take a peaceful moment for Dhikr. Let your heart find comfort in remembering Allah.',
  },
  {
    id: 'night-dhikr',
    hour: 21,
    minute: 0,
    title: 'End Your Day with Gratitude ✨',
    body: 'Before you rest, remember Allah and reflect on His blessings. Alhamdulillah for another day. 🤲',
  },
];

export type ReminderId = (typeof DHIKR_REMINDERS)[number]['id'];
export function reminderTime(hour: number, minute: number) {
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${
    hour < 12 ? 'AM' : 'PM'
  }`;
}
