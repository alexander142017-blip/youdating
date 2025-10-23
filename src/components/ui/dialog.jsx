import PropTypes from "prop-types";

// Dialog components using DaisyUI modal classes
export function Dialog({ open, onOpenChange, children }) {
  return (
    <div className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-backdrop" onClick={() => onOpenChange && onOpenChange(false)}>
        <div className="modal-box relative" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogContent({ children, className = "", ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "", ...props }) {
  return (
    <h3 className={`font-bold text-lg ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function DialogDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-sm text-base-content/70 mt-2 ${className}`} {...props}>
      {children}
    </p>
  );
}

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func,
  children: PropTypes.node.isRequired,
};

DialogContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DialogHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DialogTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DialogDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};