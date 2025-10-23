import PropTypes from "prop-types";

// Basic card components using Tailwind/DaisyUI classes
export function Card({ children, className = "", ...props }) {
  return (
    <div className={`card bg-base-100 shadow-xl ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`card-body pb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h2 className={`card-title ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-base-content/70 text-sm ${className}`} {...props}>
      {children}
    </p>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};