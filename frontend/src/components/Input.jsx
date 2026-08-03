function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <div className="mb-5">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="
          w-full
          rounded-lg
          border
          border-gray-300
          px-4
          py-3
          text-gray-900
          placeholder-gray-400
          focus:border-blue-600
          focus:ring-2
          focus:ring-blue-200
          outline-none
          transition
        "
      />
    </div>
  );
}

export default Input;