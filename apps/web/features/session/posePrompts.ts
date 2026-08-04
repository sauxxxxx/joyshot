export const posePrompts = [
  "Give us your best smile",
  "Try a peace sign",
  "Look off-camera",
  "Make your funniest face",
  "Strike a magazine pose",
  "Celebrate the moment",
] as const;

export function promptForShot(shotIndex: number) {
  return posePrompts[shotIndex % posePrompts.length];
}
