// Temporarily bypassing reCAPTCHA for domain verification
const Recaptcha = ({ onChange }) => {
  // Immediately call onChange with a dummy value to bypass verification
  if (onChange) {
    onChange('recaptcha-bypass-token');
  }
  
  // Return null or a placeholder if needed
  return null;
};

export default Recaptcha;