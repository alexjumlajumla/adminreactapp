import { RECAPTCHASITEKEY } from "configs/app-global";
import ReCAPTCHA from "react-google-recaptcha";
import "./recaptcha.css";

const Recaptcha = ({ onChange }) => {
  // Debug: Log the reCAPTCHA key being used
  console.log('Using reCAPTCHA site key:', RECAPTCHASITEKEY);
  
  const handleRecaptchaChange = (value) => {
    // Pass the reCAPTCHA response value to the parent component
    console.log('reCAPTCHA response received');
    onChange(value);
  };

  // Add cache-busting query parameter
  const recaptchaUrl = `https://www.google.com/recaptcha/api.js?render=explicit&_=${new Date().getTime()}`;
  
  return (
    <div className="recaptcha-wrapper">
      <script src={recaptchaUrl} async defer></script>
      <ReCAPTCHA
        sitekey={RECAPTCHASITEKEY}
        onChange={handleRecaptchaChange}
      />
    </div>
  );
};

export default Recaptcha;