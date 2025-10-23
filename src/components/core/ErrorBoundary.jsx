import { Component } from 'react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends Component {
  constructor(props) { 
    super(props); 
    this.state = { hasError: false, error: null }; 
  }
  
  static getDerivedStateFromError(error) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error, info) { 
    console.error('UI error:', error, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3">
            Something went wrong loading this page. Please refresh.  
            <div className="mt-1 text-xs opacity-70">{String(this.state.error?.message || '')}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};