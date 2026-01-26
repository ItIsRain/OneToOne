import React, { useState, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string; // Controlled mode
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
}) => {
  // Support both controlled and uncontrolled modes
  const [internalValue, setInternalValue] = useState<string>(defaultValue);

  // Use controlled value if provided, otherwise use internal state
  const selectedValue = value !== undefined ? value : internalValue;

  // Sync internal value with defaultValue changes (for uncontrolled mode)
  useEffect(() => {
    if (value === undefined && defaultValue) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (value === undefined) {
      // Uncontrolled mode - update internal state
      setInternalValue(newValue);
    }
    onChange(newValue); // Trigger parent handler
  };

  return (
    <select
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300  px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        selectedValue
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
      } ${className}`}
      value={selectedValue}
      onChange={handleChange}
    >
      {/* Placeholder option */}
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>
      {/* Map over options */}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
