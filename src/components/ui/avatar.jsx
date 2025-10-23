import PropTypes from "prop-types";

// Avatar components using DaisyUI classes
export function Avatar({ children, className = "", ...props }) {
  return (
    <div className={`avatar ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className = "", ...props }) {
  return (
    <div className="w-10 rounded-full">
      <img src={src} alt={alt} className={className} {...props} />
    </div>
  );
}

export function AvatarFallback({ children, className = "", ...props }) {
  return (
    <div className={`avatar placeholder ${className}`} {...props}>
      <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
        <span className="text-xs">{children}</span>
      </div>
    </div>
  );
}

Avatar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

AvatarImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
};

AvatarFallback.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};