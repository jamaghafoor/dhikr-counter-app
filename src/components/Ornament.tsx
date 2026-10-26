import React from 'react';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  G,
} from 'react-native-svg';
import { colors } from '../theme';

export function ArchArt({ size = 280 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 1.12} viewBox="0 0 280 314" fill="none">
      <Defs>
        <LinearGradient
          id="arch"
          x1="30"
          y1="10"
          x2="250"
          y2="314"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#28614E" />
          <Stop offset="1" stopColor="#123D33" />
        </LinearGradient>
        <LinearGradient id="bead" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#B8CBB2" />
          <Stop offset="1" stopColor="#6F957E" />
        </LinearGradient>
      </Defs>
      <Path
        d="M20 304V129C20 69 83 52 140 10c57 42 120 59 120 119v175H20z"
        fill="url(#arch)"
      />
      <Path
        d="M32 303V132c0-54 56-71 108-109 52 38 108 55 108 109v171M43 303V135c0-47 49-64 97-99 48 35 97 52 97 99v168"
        stroke="#B6AC74"
        strokeOpacity={0.4}
      />
      <G stroke="#9CAE90" strokeOpacity={0.16}>
        <Path d="M32 150l216 125M32 225l216-125M70 70v233M210 70v233M140 32v271M32 188h216M32 254h216" />
        <Path d="M140 90l86 98-86 98-86-98 86-98zM70 188l70-70 70 70-70 70-70-70z" />
      </G>
      <Path
        d="M159 218c-58 34-99-15-78-58 20-43 90-49 112-9 18 32 5 50-18 64"
        stroke="#B8CBB2"
        strokeWidth={2}
      />
      {Array.from({ length: 25 }, (_, i) => {
        const a = ((i * 13.4 + 32) * Math.PI) / 180;
        return (
          <Circle
            key={i}
            cx={139 + Math.cos(a) * 58}
            cy={177 + Math.sin(a) * 47}
            r={7.4}
            fill="url(#bead)"
            stroke="#214F3D"
            strokeWidth={1.5}
          />
        );
      })}
      <Path
        d="M174 211l10 15M183 224l15 28M183 224l6 30M183 224l21 22M180 224l10 28"
        stroke={colors.gold}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={180} cy={220} r={5} fill={colors.gold} />
      <Path
        d="M140 59v12M134 65h12M83 110v8M79 114h8M204 103v8M200 107h8"
        stroke="#D4C392"
        strokeWidth={1.5}
      />
      <Path d="M137 276a10 10 0 0012-15 11 11 0 11-12 15" fill="#CEBB84" />
    </Svg>
  );
}

export function Pattern({ color = colors.gold }: { color?: string }) {
  return (
    <Svg
      width={104}
      height={104}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth={0.7}
      opacity={0.22}
    >
      <Path d="M50 0L62 29 91 9 71 38 100 50 71 62 91 91 62 71 50 100 38 71 9 91 29 62 0 50 29 38 9 9 38 29z" />
      <Path d="M50 15l25 10 10 25-10 25-25 10-25-10-10-25 10-25zM50 28l22 22-22 22-22-22z" />
      <Circle cx={50} cy={50} r={31} />
    </Svg>
  );
}
