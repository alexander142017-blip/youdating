import PropTypes from "prop-types";

// Dropdown menu components using DaisyUI classes
export function DropdownMenu({ children }) {
  return (
    <div className="dropdown">
      {children}
    </div>
  );
}

export function DropdownMenuTrigger({ children, ...props }) {
  return (
    <label tabIndex={0} className="btn btn-ghost btn-circle" {...props}>
      {children}
    </label>
  );
}

export function DropdownMenuContent({ children, className = "", ...props }) {
  return (
    <ul tabIndex={0} className={`dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 ${className}`} {...props}>
      {children}
    </ul>
  );
}

export function DropdownMenuItem({ children, onClick, className = "", ...props }) {
  return (
    <li>
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    </li>
  );
}

export function DropdownMenuLabel({ children, className = "", ...props }) {
  return (
    <li>
      <span className={`text-sm font-semibold text-base-content/70 px-2 py-1 ${className}`} {...props}>
        {children}
      </span>
    </li>
  );
}

export function DropdownMenuSeparator() {
  return <li><hr className="my-2" /></li>;
}

DropdownMenu.propTypes = {
  children: PropTypes.node.isRequired,
};

DropdownMenuLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DropdownMenuTrigger.propTypes = {
  children: PropTypes.node.isRequired,
};

DropdownMenuContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DropdownMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};