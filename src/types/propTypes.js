import PropTypes from 'prop-types';

export const UserShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  email: PropTypes.string,
  full_name: PropTypes.string,
  isPremium: PropTypes.bool,
  premiumExpiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  boosts_remaining: PropTypes.number,
  super_likes_remaining: PropTypes.number,
  is_suspended: PropTypes.bool,
  boost_expires_at: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  created_date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  role: PropTypes.string, // For admin role checking
});

export const TargetUserShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  email: PropTypes.string,
  full_name: PropTypes.string,
});

export const MatchIdType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

export default { UserShape, TargetUserShape, MatchIdType };