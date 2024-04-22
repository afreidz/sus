export function getTimeBetween(date1: Date, date2: Date): string {
  const elapsed = date2.getTime() - date1.getTime(); // Difference in milliseconds

  // Convert milliseconds to hours, minutes, and seconds
  let seconds = Math.floor(elapsed / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  seconds = seconds % 60; // Remaining seconds
  minutes = minutes % 60; // Remaining minutes

  // Pad with zero if necessary to ensure two digits
  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = seconds.toString().padStart(2, "0");

  // Format the time as "hh:mm:ss"
  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}
