import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export type IconName =
  | 'beads'
  | 'back'
  | 'chevron'
  | 'settings'
  | 'hand'
  | 'auto'
  | 'undo'
  | 'reset'
  | 'check'
  | 'plus'
  | 'close'
  | 'pause'
  | 'play'
  | 'book'
  | 'journey'
  | 'leaf'
  | 'shield'
  | 'vibration'
  | 'volume'
  | 'sun'
  | 'bell'
  | 'moon'
  | 'search'
  | 'star'
  | 'more';
export function Icon({
  name,
  size = 22,
  color = colors.green,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const paths: Partial<Record<IconName, string>> = {
    bell: 'M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    moon: 'M20 14A9 9 0 0110 4a9 9 0 1010 10z',
    back: 'M15 5l-7 7 7 7M8 12h13',
    chevron: 'M9 5l7 7-7 7',
    settings:
      'M9 3h6l.6 2.5 2.1 1.2 2.5-.7 3 5.2-1.9 1.8v2.4l1.9 1.8-3 5.2-2.5-.7-2.1 1.2L15 24H9l-.6-2.1-2.1-1.2-2.5.7-3-5.2L2.7 14v-2.4L.8 9.8l3-5.2 2.5.7 2.1-1.2L9 3',
    hand: 'M8 12V5a2 2 0 014 0v6-2a2 2 0 014 0v2a2 2 0 014 0v5c0 4-3 7-7 7h-1c-2 0-3-1-4-3l-4-6a1.8 1.8 0 013-2l1 1',
    auto: 'M20 8a8 8 0 10.5 7M20 3v5h-5M12 7v5l3 2',
    undo: 'M8 5L3 10l5 5M3 10h10a6 6 0 010 12',
    reset: 'M20 8a8 8 0 10.5 7M20 3v5h-5',
    check: 'M5 12l4 4L19 6',
    plus: 'M12 5v14M5 12h14',
    close: 'M6 6l12 12M6 18L18 6',
    pause: 'M8 5v14M16 5v14',
    play: 'M8 4l12 8-12 8z',
    book: 'M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15',
    journey: 'M4 20v-5M10 20V9M16 20V4M22 20H2',
    leaf: 'M20 3C9 1 3 6 5 14s14 8 15-11zM5 21L16 9',
    shield: 'M12 3l8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3zM8 12l3 3 5-6',
    vibration:
      'M1 8v8M23 8v8M4 5v14M20 5v14M9 3h6a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z',
    volume: 'M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 010 8M19 4a11 11 0 010 16',
    sun: 'M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2',
    search: 'M16 16l5 5',
    star: 'M12 2l2.6 6.4 6.9.6-5.3 4.5 1.6 6.8-5.8-3.6-5.8 3.6 1.6-6.8L2.5 9l6.9-.6z',
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox={name === 'settings' ? '-1 1 26 25' : '0 0 24 24'}
      fill="none"
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] && <Path d={paths[name]} />}
      {name === 'settings' && <Circle cx={12} cy={13} r={3} />}
      {name === 'sun' && <Circle cx={12} cy={12} r={4} />}
      {name === 'search' && <Circle cx={10} cy={10} r={7} />}
      {name === 'more' &&
        [5, 12, 19].map(cx => (
          <Circle key={cx} cx={cx} cy={12} r={1} fill={color} />
        ))}
      {name === 'beads' && (
        <>
          {Array.from({ length: 10 }, (_, i) => {
            const a = ((i * 30 - 210) * Math.PI) / 180;
            return (
              <Circle
                key={i}
                cx={12 + Math.cos(a) * 7.5}
                cy={10 + Math.sin(a) * 7.5}
                r={2.2}
                fill={color}
                strokeWidth={0}
              />
            );
          })}
          <Path d="M8 17l-2 5M7 21l-2-1M6 23l-3-1" />
        </>
      )}
      {name === 'pause' && (
        <Rect
          x={7}
          y={5}
          width={2}
          height={14}
          rx={1}
          fill={color}
          strokeWidth={0}
        />
      )}
    </Svg>
  );
}
