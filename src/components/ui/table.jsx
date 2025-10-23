import PropTypes from "prop-types";

// Table components using Tailwind classes
export function Table({ children, className = "", ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={`table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "", ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...props }) {
  return (
    <tr className={`hover ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "", ...props }) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
}

Table.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableHead.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableCell.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};