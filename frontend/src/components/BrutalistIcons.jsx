import React from "react";

/**
 * Neo-Brutalist App Logo Badge
 * Matches the website's sharp black borders, heavy contrast, and amber/indigo accents.
 */
export function AppLogo({ size = 38, className = "" }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center border-2 border-black flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: "#4f46e5",
        boxShadow: "3px 3px 0 #000",
      }}
      aria-label="Gen AI Assistant Logo"
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Geometric open book + AI spark */}
        <path
          d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v15H5.5A2.5 2.5 0 0 0 3 20.5V5.5z"
          fill="#faf7f2"
          stroke="#000"
          strokeWidth="1.8"
        />
        <path
          d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v15h5.5a2.5 2.5 0 0 1 2.5 2.5V5.5z"
          fill="#faf7f2"
          stroke="#000"
          strokeWidth="1.8"
        />
        {/* Central neural spark in amber */}
        <path
          d="M12 2L13.8 6.5L18 8L13.8 9.5L12 14L10.2 9.5L6 8L10.2 6.5L12 2Z"
          fill="#f59e0b"
          stroke="#000"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

/**
 * Custom Neo-Brutalist Mascot / Robot Illustration
 * Replaces the cartoon 🤖 emoji on the empty chat state.
 */
export function RobotIllustration({ size = 120, className = "" }) {
  return (
    <div
      className={`inline-block border-4 border-black p-4 ${className}`}
      style={{
        background: "#e0e7ff",
        boxShadow: "8px 8px 0 #000",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Antenna */}
        <line x1="50" y1="6" x2="50" y2="20" stroke="#000" strokeWidth="4" />
        <circle cx="50" cy="6" r="5" fill="#f59e0b" stroke="#000" strokeWidth="3" />

        {/* Head Box */}
        <rect
          x="16"
          y="20"
          width="68"
          height="54"
          fill="#fff"
          stroke="#000"
          strokeWidth="4"
        />

        {/* Ear Bolts */}
        <rect x="8" y="38" width="8" height="18" fill="#4f46e5" stroke="#000" strokeWidth="3" />
        <rect x="84" y="38" width="8" height="18" fill="#4f46e5" stroke="#000" strokeWidth="3" />

        {/* Visor Area */}
        <rect
          x="26"
          y="30"
          width="48"
          height="18"
          fill="#1e1b4b"
          stroke="#000"
          strokeWidth="3"
        />

        {/* Pixel Eyes */}
        <rect x="34" y="35" width="8" height="8" fill="#38bdf8" />
        <rect x="58" y="35" width="8" height="8" fill="#38bdf8" />

        {/* Mouth Grille */}
        <rect x="32" y="56" width="36" height="8" fill="#faf7f2" stroke="#000" strokeWidth="2" />
        <line x1="41" y1="56" x2="41" y2="64" stroke="#000" strokeWidth="2" />
        <line x1="50" y1="56" x2="50" y2="64" stroke="#000" strokeWidth="2" />
        <line x1="59" y1="56" x2="59" y2="64" stroke="#000" strokeWidth="2" />

        {/* Neck */}
        <rect x="42" y="74" width="16" height="8" fill="#f59e0b" stroke="#000" strokeWidth="3" />

        {/* Shoulders */}
        <path
          d="M20 94 C20 84 32 82 50 82 C68 82 80 84 80 94 Z"
          fill="#4f46e5"
          stroke="#000"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
}

/**
 * Brutalist Sliders / Controls Icon
 * Replaces 🎛️ in the Style steer button and system notifications.
 */
export function SlidersIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      {/* Slider knobs */}
      <rect x="7" y="4" width="4" height="4" fill="currentColor" />
      <rect x="14" y="10" width="4" height="4" fill="currentColor" />
      <rect x="9" y="16" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

/**
 * Brutalist Thumbs Up Icon
 * Replaces 👍 in feedback buttons.
 */
export function ThumbUpIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <path d="M2 10h4v11H2V10zm20 2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 3 7.59 8.59C7.22 8.95 7 9.45 7 10v9c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

/**
 * Brutalist Thumbs Down Icon
 * Replaces 👎 in feedback buttons.
 */
export function ThumbDownIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <path d="M22 14h-4V3h4v11zm-20-2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 21l5.58-5.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22L1.14 11.27c-.09.23-.14.47-.14.73v2z" />
    </svg>
  );
}

/**
 * Brutalist Alert / Warning Icon
 * Replaces ⚠️ in system warnings.
 */
export function AlertWarningIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <path d="M12 2L2 21h20L12 2z" fill="#fef3c7" />
      <line x1="12" y1="9" x2="12" y2="14" stroke="#92400e" strokeWidth="2.5" />
      <rect x="11" y="16.5" width="2" height="2" fill="#92400e" />
    </svg>
  );
}

/**
 * Brutalist Checkmark / Success Icon
 * Replaces ✅ and ✓.
 */
export function CheckIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Brutalist Cross / Error Icon
 * Replaces ❌ and ✗.
 */
export function CrossIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Brutalist Difficulty Indicator Badge
 * Replaces 🟢, 🟡, 🔴 in the quiz selector with bold tiered signal meters.
 */
export function DifficultyBadge({ level = "medium", size = 26 }) {
  const configs = {
    easy: {
      color: "#10b981",
      bars: [true, false, false],
      label: "L1",
    },
    medium: {
      color: "#f59e0b",
      bars: [true, true, false],
      label: "L2",
    },
    hard: {
      color: "#ef4444",
      bars: [true, true, true],
      label: "L3",
    },
  };

  const current = configs[level] || configs.medium;

  return (
    <div
      className="inline-flex items-center gap-1 border-2 border-black p-1.5 flex-shrink-0"
      style={{
        background: "#fff",
        boxShadow: "2px 2px 0 #000",
        height: size,
      }}
      title={`${level.toUpperCase()} Difficulty`}
    >
      {current.bars.map((active, i) => (
        <span
          key={i}
          className="border border-black"
          style={{
            display: "inline-block",
            width: 7,
            height: 10 + i * 4,
            background: active ? current.color : "#e5e7eb",
          }}
        />
      ))}
    </div>
  );
}
