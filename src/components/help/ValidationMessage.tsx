import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type ValidationLevel = 'success' | 'warning' | 'error' | 'info';

interface ValidationMessageProps {
  level: ValidationLevel;
  message: string;
  className?: string;
}

export function ValidationMessage({ level, message, className = "" }: ValidationMessageProps) {
  const getIcon = () => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTextColor = () => {
    switch (level) {
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  const getBgColor = () => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`flex items-start space-x-2 p-2 rounded border text-sm ${getBgColor()} ${className}`}>
      {getIcon()}
      <span className={getTextColor()}>{message}</span>
    </div>
  );
}