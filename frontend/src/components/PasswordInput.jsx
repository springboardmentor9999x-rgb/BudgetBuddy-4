import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  onFocus,
  onBlur,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleKeyUp = (e) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  return (
    <div className="mb-5">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {capsLock && (
        <p className="mt-2 text-sm text-orange-600 font-medium">
          ⚠️ Caps Lock is ON
        </p>
      )}
    </div>
  );
}

export default PasswordInput;