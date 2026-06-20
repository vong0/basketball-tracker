export const LOOP_LEAD = 0.2;              // seconds before segment end when loop fires
export const SEEK_DELTA_SECONDS = 1;       // arrow-key seek step
export const SPEED_FAST = 2;              // fast speed multiplier (shift key / right long-press)
export const SPEED_SLOW = 0.5;            // slow speed multiplier (ctrl key / left long-press)
export const CLICK_DEBOUNCE_MS = 250;     // tap debounce before distinguishing click vs double-click
export const LONG_PRESS_MS = 500;         // hold duration (ms) to activate speed boost on mobile
export const SWIPE_COMMIT_PX = 120;       // horizontal travel (px) to commit a segment change
export const SWIPE_VELOCITY_PX_MS = 0.2;  // velocity threshold (px/ms) for a flick commit
export const SWIPE_MIN_FLICK_PX = 25;    // minimum displacement (px) for a flick commit
export const SWIPE_STALE_MS = 150;        // velocity = 0 if finger stopped >150ms before lift
export const SWIPE_MOVE_THRESHOLD_PX = 10; // movement (px) that promotes pointerdown → swipe
export const SWIPE_EDGE_RESIST = 0.15;    // finger follows at 15% past first/last segment edge
export const SWIPE_EDGE_CAP_PX = 60;     // hard cap (px) on edge drag distance
export const SWIPE_SNAP_MS = 250;         // snap-back animation duration (ms)
export const SWIPE_COMMIT_MS = 280;       // slide-off animation duration (ms) on commit
export const SWIPE_NEIGHBOR_GAP_PX = 24;  // gap (px) between video slot and neighbor placeholder
export const YT_IFRAME_WIDTH = 1920;      // fixed iframe width for HD trick on mobile
export const YT_IFRAME_HEIGHT = 1080;     // fixed iframe height for HD trick on mobile
