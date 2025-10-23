import PropTypes from "prop-types";

// Input component using DaisyUI classes
export function Input({ 
  className = "", 
  type = "text", 
  ...props 
}) {
  return (
    <input 
      type={type}
      className={`input input-bordered w-full ${className}`}
      {...props}
    />
  );
}

Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
};