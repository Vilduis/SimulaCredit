import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  description: string;
  example?: string;
  range?: string;
  warning?: string;
  className?: string;
}

export function HelpTooltip({ title, description, example, range, warning, className = "" }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={`w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help transition-colors ${className}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4 bg-white border shadow-lg">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">💡</span>
              <div>
                <p className="text-sm text-blue-900 mb-1">{title}</p>
                <p className="text-sm text-gray-700">{description}</p>
              </div>
            </div>
            
            {example && (
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-600 mb-1">Ejemplo:</p>
                <p className="text-sm text-gray-900">{example}</p>
              </div>
            )}
            
            {range && (
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-blue-600 mb-1">Rango permitido:</p>
                <p className="text-sm text-blue-900">{range}</p>
              </div>
            )}
            
            {warning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="flex items-start space-x-1">
                  <span className="text-yellow-600">⚠️</span>
                  <p className="text-xs text-yellow-800">{warning}</p>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}