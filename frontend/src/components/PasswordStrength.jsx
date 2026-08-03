import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function PasswordStrength({ password }) {
  if (!password) return null;

  let message = "";
  let success = false;

  if (password.length < 8) {
    message = "Password should contain at least 8 characters.";
  } else if (!/[A-Z]/.test(password)) {
    message = "Add at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    message = "Add at least one lowercase letter.";
  } else if (!/\d/.test(password)) {
    message = "Add at least one number.";
  } else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    message = "Add at least one special character.";
  } else {
    success = true;
    message = "Strong password";
  }

  return (
    <div className="mt-2 mb-4">
      <div
        className={`flex items-center gap-2 text-sm ${
          success ? "text-green-600" : "text-orange-600"
        }`}
      >
        {success ? (
          <FaCheckCircle />
        ) : (
          <FaExclamationTriangle />
        )}

        <span>{message}</span>
      </div>
    </div>
  );
}

export default PasswordStrength;