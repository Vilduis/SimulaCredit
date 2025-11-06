import { ReactNode } from "react";
import { Label } from "../ui/label";
import { HelpTooltip } from "./HelpTooltip";
import { ValidationMessage, ValidationLevel } from "./ValidationMessage";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children?: ReactNode;
  helpTooltip?: {
    title: string;
    description: string;
    example?: string;
    range?: string;
    warning?: string;
  };
  validation?: {
    level: ValidationLevel;
    message: string;
  } | null;
  helpText?: string;
  className?: string;
}

export function FormField({
  label,
  required = false,
  children,
  helpTooltip,
  validation,
  helpText,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <Label className="text-sm">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {helpTooltip && (
          <HelpTooltip
            title={helpTooltip.title}
            description={helpTooltip.description}
            example={helpTooltip.example}
            range={helpTooltip.range}
            warning={helpTooltip.warning}
          />
        )}
      </div>

      {children}

      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}

      {validation && (
        <ValidationMessage
          level={validation.level}
          message={validation.message}
          className="mt-2"
        />
      )}
    </div>
  );
}
