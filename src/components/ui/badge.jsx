import PropTypes from "prop-types";

// Badge component using DaisyUI classes
export function Badge({ 
  children, 
  variant = "default", 
  className = "",
  ...props 
}) {
  const variants = {
    default: "badge",
    primary: "badge badge-primary",
    secondary: "badge badge-secondary", 
    accent: "badge badge-accent",
    ghost: "badge badge-ghost",
  };
  
  return (
    <span 
      className={`${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "primary", "secondary", "accent", "ghost"]),
  className: PropTypes.string,
};