import { RECAPTCHASITEKEY } from "configs/app-global";
import ReCAPTCHA from "react-google-recaptcha";
import "./recaptcha.css";

const Recaptcha = ({ onChange }) => {
  const handleRecaptchaChange = (value) => {
    // Pass the reCAPTCHA response value to the parent component
    onChange(value);
  };

  return (
    <div className="recaptcha-wrapper">
      <ReCAPTCHA
        sitekey={RECAPTCHASITEKEY}
        onChange={handleRecaptchaChange}
      />
    </div>
  );
};

export default Recaptcha;