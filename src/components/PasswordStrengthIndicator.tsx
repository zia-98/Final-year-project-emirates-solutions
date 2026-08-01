import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  return passwordRules.filter((rule) => rule.test(password)).length;
};

export const isPasswordStrong = (password: string): boolean => {
  return passwordRules.every((rule) => rule.test(password));
};

const PasswordStrengthIndicator = ({ password, className = "" }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  
  const strengthLabel = useMemo(() => {
    if (strength === 0) return "";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  }, [strength]);
  
  const strengthColor = useMemo(() => {
    if (strength <= 2) return "bg-destructive";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  }, [strength]);

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={strength >= 4 ? "text-green-500" : strength >= 3 ? "text-yellow-500" : "text-destructive"}>
            {strengthLabel}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${(strength / passwordRules.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {passwordRules.map((rule, idx) => {
          const passed = rule.test(password);
          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 text-xs ${
                passed ? "text-green-500" : "text-muted-foreground"
              }`}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              <span>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
