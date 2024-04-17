export function calculateCropPercentage(
  rect1: DOMRect,
  rect2: DOMRect
): { width: number; height: number } {
  const widthDiff = ((rect1.width - rect2.width) / rect1.width) * 100;
  const heightDiff = ((rect1.height - rect2.height) / rect1.height) * 100;

  return {
    width: widthDiff < 0 ? 0 : widthDiff, // Prevent negative values
    height: heightDiff < 0 ? 0 : heightDiff, // Prevent negative values
  };
}
