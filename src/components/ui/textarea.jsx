import PropTypes from "prop-types";

// Textarea component using DaisyUI classes
export function Textarea({ 
  className = "", 
  ...props 
}) {
  return (
    <textarea 
      className={`textarea textarea-bordered w-full ${className}`}
      {...props}
    />
  );
}

Textarea.propTypes = {
  className: PropTypes.string,
};