import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

interface SuccessAlertProps {
  title: string;
  message: string;
  details?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function SuccessAlert({ 
  title, 
  message, 
  details, 
  primaryAction, 
  secondaryAction
}: SuccessAlertProps) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="w-5 h-5 text-green-600" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <h4 className="text-green-900 mb-1">{title}</h4>
            <p className="text-green-800">{message}</p>
            {details && (
              <p className="text-sm text-green-700 mt-1">{details}</p>
            )}
          </div>
          
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap gap-2">
              {primaryAction && (
                <Button 
                  onClick={primaryAction.onClick}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {primaryAction.label}
                </Button>
              )}
              
              {secondaryAction && (
                <Button 
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}