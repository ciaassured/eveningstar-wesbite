export type ModelPathVector = readonly [x: number, y: number, z: number];

// Use `?debugPath=1` to see the active path section and scroll progress.
//
// Tuning quick reference:
// - progress: whole-page scroll position, from 0 at the top to 1 at the bottom.
//   This is where the board arrives at this stage's values. Movement toward
//   this stage starts at the previous stage's progress value.
// - position: [x, y, z]. x moves left/right, y moves down/up, z moves away/toward.
// - rotation: [x, y, z] in radians. x tilts, y turns, z rolls. 0.1 rad is about 5.7deg.
// - scale: model size. Larger is closer/bigger.
// - cameraPosition: [x, y, z]. z is camera zoom; smaller z feels closer.
// - pointerInfluence / idleInfluence: per-section strength for mouse and idle motion.
// - To hold the board during a sticky page section, add two stages with the
//   same pose and different progress values. The board will stay there while
//   the page scrolls through that range.
//
// Good centered, top-down baseline:
// - position: [0, 0, 0]
// - rotation: [0, 0, 0]
// - cameraPosition: [0, 0, 5.7]
// Scale can stay section-specific; it changes board size, not center alignment.

export type ModelPathStage = {
  id: string;
  progress: number;
  position: ModelPathVector;
  rotation: ModelPathVector;
  scale: number;
  pointerInfluence: number;
  idleInfluence: number;
  cameraPosition: ModelPathVector;
};

type ModelPath = readonly ModelPathStage[];

export const MODEL_PATH_COMPACT_WIDTH = 900;

export const MODEL_MOTION = {
  // Overall mouse response. The values are max offsets, not accumulated motion.
  pointer: {
    smoothing: 10,
    returnSmoothing: 3.2,
    maxPosition: [0.035, 0.02, 0] as const,
    maxRotation: [0.055, 0.085, 0.025] as const
  },

  // Overall idle movement. These create bounded bob/tilt, not infinite spin.
  idle: {
    speed: 0.72,
    bobAmount: 0.042,
    bobJitterAmount: 0.012,
    sideAmount: 0.018,
    depthAmount: 0.01,
    pitchAmount: 0.012,
    yawAmount: 0.024,
    rollAmount: 0.018
  }
} as const;

export const MODEL_PATH = {
  // Desktop/tablet-wide layout: copy and cards sit beside the board.
  desktop: [
    {
      id: 'hero',
      // Hero section: board sits left of the Evening Star heading and intro copy.
      progress: 0,
      position: [-1.58, -0.12, 0],
      rotation: [0.58, -0.42, -0.14],
      scale: 0.92,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0, 5.35]
    },
    {
      id: 'statement',
      // Statement section: lines up with "PCB presence, not a static render".
      progress: 0.24,
      position: [-1.08, 0, -0.04],
      rotation: [1.5, -1.5, 0],
      scale: 0.9,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0, 5.48]
    },
    {
      id: 'comparison-approach',
      // Comparison section: pull toward the live-model dock before the sticky panel locks in.
      progress: 0.42,
      position: [-0.9, 0.15, -0.16],
      rotation: [1.5, -1.5, 0],
      scale: 0.5,
      pointerInfluence: 0.55,
      idleInfluence: 0.75,
      cameraPosition: [0, 0, 5.86]
    },
    {
      id: 'comparison-dock',
      // Fast magnetic settle into the transparent dock beside the greyed Morningstar card.
      progress: 0.5,
      position: [-0.9, 0.15, -0.16],
      rotation: [1.5, -1.5, 0],
      scale: 0.3,
      pointerInfluence: 0.18,
      idleInfluence: 0.48,
      cameraPosition: [0, 0, 6.02]
    },
    {
      id: 'comparison-hold',
      // Same pose as comparison-dock: this keeps the board parked while the table scrolls.
      progress: 0.68,
      position: [-0.9, 0.15, -0.16],
      rotation: [1.5, -1.5, 0],
      scale: 0.3,
      pointerInfluence: 0.18,
      idleInfluence: 0.48,
      cameraPosition: [0, 0, 6.02]
    },
    {
      id: 'comparison-release',
      // Release from the dock and rejoin the normal product-page path.
      progress: 0.77,
      position: [0.04, -0.02, -0.1],
      rotation: [0.42, 0.62, -0.22],
      scale: 0.82,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0, 5.72]
    },
    {
      id: 'inspection',
      // Inspection section: final pose near "Built to ship cleanly".
      progress: 0.92,
      position: [0, 0.5, 0],
      rotation: [1.5, 0, 0],
      scale: 0.78,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0, 5.7]
    }
  ],

  // Compact layout: page sections stack vertically, so the board path is centered and lower.
  compact: [
    {
      id: 'hero',
      // Compact hero: board starts lower because the heading and stats stack.
      progress: 0,
      position: [0, -0.8, 0],
      rotation: [0.58, -0.42, -0.14],
      scale: 0.78,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0.25, 6.2]
    },
    {
      id: 'statement',
      // Compact statement: board moves up as the first body section enters.
      progress: 0.24,
      position: [0, -0.22, -0.05],
      rotation: [0.5, 0.1, -0.18],
      scale: 0.74,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0.25, 6.38]
    },
    {
      id: 'comparison-approach',
      // Compact comparison: move toward the left-hand model dock above the table.
      progress: 0.41,
      position: [-0.26, 0.46, -0.12],
      rotation: [0.5, -0.16, -0.12],
      scale: 0.32,
      pointerInfluence: 0.45,
      idleInfluence: 0.7,
      cameraPosition: [0, 0.25, 6.72]
    },
    {
      id: 'comparison-dock',
      // Fast magnetic settle into the transparent model dock.
      progress: 0.49,
      position: [-0.3, 0.5, -0.16],
      rotation: [0.58, -0.08, -0.08],
      scale: 0.28,
      pointerInfluence: 0.16,
      idleInfluence: 0.44,
      cameraPosition: [0, 0.25, 6.92]
    },
    {
      id: 'comparison-hold',
      // Same pose as comparison-dock: this keeps the board parked through the sticky comparison.
      progress: 0.69,
      position: [-0.3, 0.5, -0.16],
      rotation: [0.58, -0.08, -0.08],
      scale: 0.28,
      pointerInfluence: 0.16,
      idleInfluence: 0.44,
      cameraPosition: [0, 0.25, 6.92]
    },
    {
      id: 'comparison-release',
      // Release from the dock and rejoin the normal product-page path.
      progress: 0.78,
      position: [0, 0.12, -0.12],
      rotation: [0.4, 0.68, -0.22],
      scale: 0.62,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0.25, 6.63]
    },
    {
      id: 'inspection',
      // Compact inspection: lower than the implementation rail labels.
      progress: 0.92,
      position: [0, -0.55, -0.18],
      rotation: [0.32, -0.78, -0.16],
      scale: 0.46,
      pointerInfluence: 1,
      idleInfluence: 1,
      cameraPosition: [0, 0.25, 6.9]
    }
  ]
} satisfies Record<'desktop' | 'compact', ModelPath>;
