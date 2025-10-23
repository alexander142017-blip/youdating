import PropTypes from "prop-types";

// Button component using DaisyUI classes
export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  disabled = false,
  ...props 
}) {
  const baseClasses = "btn";
  
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    outline: "btn-outline",
    ghost: "btn-ghost",
    link: "btn-link",
  };
  
  const sizes = {
    xs: "btn-xs",
    sm: "btn-sm", 
    md: "",
    lg: "btn-lg",
  };
  
  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || "",
    disabled ? "btn-disabled" : "",
    className
  ].filter(Boolean).join(" ");
  
  return (
    <button 
      className={classes} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "outline", "ghost", "link"]),
  size: PropTypes.oneOf(["xs", "sm", "md", "lg"]),
  className: PropTypes.string,
  disabled: PropTypes.bool,
};