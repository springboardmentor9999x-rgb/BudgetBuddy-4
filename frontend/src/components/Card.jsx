function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-gray-200
        p-8
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;