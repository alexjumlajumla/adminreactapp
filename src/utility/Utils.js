// Utility function to generate unique date labels for charts
export const getUniqueDateLabels = (datesArray) => {
  if (!datesArray || !datesArray.length) return [];

  // Extract only unique date strings
  const uniqueDates = [...new Set(datesArray.map(date => date.toString()))];
  
  // Map them back to the format needed
  return uniqueDates.map(date => {
    try {
      // If using Moment.js
      if (window.moment) {
        // Use UTC parsing and convert to local time to preserve timezone
        return window.moment.utc(date).local().format('D MMM YYYY');
      }
      
      // Fallback to native Date
      const dateObj = new Date(date);
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString('en-US', { month: 'short' });
      const year = dateObj.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (err) {
      return date; // Return original if parsing fails
    }
  });
}; 