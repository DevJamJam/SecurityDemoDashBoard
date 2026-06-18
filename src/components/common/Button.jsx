import classnames from "classnames";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  type = "button",
  className = "",
  icon,
}) {
  return (
    <button
      type={type}
      className={classnames(
        "btn",
        `btn--${variant}`,
        size !== "md" && `btn--${size}`,
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
}
