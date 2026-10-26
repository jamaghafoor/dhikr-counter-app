import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

// Original vector artwork: no downloaded assets or image decoding at launch.
export function WelcomeArt({ width = 280 }: { width?: number }) {
  const beads = Array.from({ length: 28 }, (_, i) => {
    const angle = ((56 + i * 11.8) * Math.PI) / 180;
    return { x: 150 + Math.cos(angle) * 65, y: 107 + Math.sin(angle) * 51 };
  });
  return (
    <Svg width={width} height={width * 0.625} viewBox="0 0 320 200" fill="none">
      <Defs>
        <LinearGradient id="welcome-bead" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#F1F0D9" />
          <Stop offset="0.45" stopColor="#BED2B9" />
          <Stop offset="1" stopColor="#729880" />
        </LinearGradient>
        <LinearGradient
          id="welcome-thread"
          x1="180"
          y1="139"
          x2="220"
          y2="198"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E2CF99" />
          <Stop offset="1" stopColor="#A58B50" />
        </LinearGradient>
      </Defs>
      <G stroke="#BEBD8C" strokeOpacity={0.24} strokeWidth={0.8}>
        <Path d="M67 178V91C67 51 115 36 160 5c45 31 93 46 93 86v87M78 178V94c0-35 42-49 82-77 40 28 82 42 82 77v84" />
        <Path d="M23 178h274M42 186h236" strokeOpacity={0.12} />
      </G>
      <Ellipse cx={156} cy={166} rx={70} ry={9} fill="#092D24" opacity={0.25} />
      <Path d="M159 35a9 9 0 0010-12 10 10 0 11-10 12" fill="#D4C08B" />
      <G transform="rotate(-16 150 107)">
        <Path
          d={beads
            .map((bead, i) => `${i ? 'L' : 'M'}${bead.x} ${bead.y}`)
            .join(' ')}
          stroke="#B7CBAE"
          strokeWidth={2}
        />
        {beads.map((bead, i) => (
          <G key={i}>
            <Circle
              cx={bead.x + 1}
              cy={bead.y + 2}
              r={7.9}
              fill="#0A3329"
              opacity={0.35}
            />
            <Circle
              cx={bead.x}
              cy={bead.y}
              r={7.6}
              fill="url(#welcome-bead)"
              stroke="#AEC4A3"
              strokeWidth={0.5}
            />
            <Circle
              cx={bead.x - 2.2}
              cy={bead.y - 2.5}
              r={1.7}
              fill="#F8F7E4"
              opacity={0.55}
            />
          </G>
        ))}
        <Path d="M186 151l13 15" stroke="#D4C08B" strokeWidth={2.4} />
        <Path
          d="M199 168l7 27M199 168l14 25M199 168l21 20M199 168l3 26"
          stroke="url(#welcome-thread)"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <Circle cx={198} cy={165} r={4.2} fill="#D4C08B" />
      </G>
      <G fill="#D4C08B">
        <Path
          d="M39 71l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM278 120l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"
          opacity={0.8}
        />
        <Circle cx={96} cy={28} r={1.4} opacity={0.55} />
        <Circle cx={274} cy={57} r={1.4} opacity={0.55} />
        <Circle cx={49} cy={137} r={1} opacity={0.4} />
      </G>
    </Svg>
  );
}
