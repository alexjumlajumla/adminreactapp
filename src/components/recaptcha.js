// reCAPTCHA temporarily disabled in production
const Recaptcha = ({ onChange }) => {
  // Immediately call onChange with a dummy value to bypass verification
  if (onChange) {
    onChange('recaptcha-bypassed');
  }
  
  // Return null or a placeholder if needed
  return null;
};

export default Recaptcha;