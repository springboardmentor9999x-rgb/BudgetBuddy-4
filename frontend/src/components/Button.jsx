function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  className = "",
}) {
  const baseStyle =
    "w-full rounded-lg px-4 py-3 font-medium transition-all duration-200 focus:outline-none focus:ring-2";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300",

    secondary:
      "bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200",

    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${
        variants[variant]
      } ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : ""
      } ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export default Button;