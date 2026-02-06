"use client";
import React, { useState, useRef } from "react";
import Input from "./input/InputField";
import TextArea from "./input/TextArea";
import Select from "./Select";
import Label from "./Label";
import type { FormField, FieldOption } from "@/config/eventTypeSchema";

interface DynamicFieldProps {
  field: FormField;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

// Sortable List Component
const SortableList: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}> = ({ value = [], onChange, placeholder }) => {
  const [newItem, setNewItem] = useState("");
  const idCounter = useRef(0);
  const itemIds = useRef<Map<number, string>>(new Map());

  // Generate stable IDs for items - track by original insertion order
  const getItemId = (index: number) => {
    if (!itemIds.current.has(index)) {
      itemIds.current.set(index, `sortable-${idCounter.current++}`);
    }
    return itemIds.current.get(index)!;
  };

  const addItem = () => {
    if (newItem.trim()) {
      // Assign a new ID for the new item
      const newIndex = value.length;
      itemIds.current.set(newIndex, `sortable-${idCounter.current++}`);
      onChange([...value, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    // Rebuild ID map after removal
    const newIds = new Map<number, string>();
    let newIdx = 0;
    value.forEach((_, i) => {
      if (i !== index) {
        newIds.set(newIdx++, itemIds.current.get(i) || `sortable-${idCounter.current++}`);
      }
    });
    itemIds.current = newIds;
    onChange(value.filter((_, i) => i !== index));
  };

  const moveItem = (from: number, to: number) => {
    const newList = [...value];
    const [item] = newList.splice(from, 1);
    newList.splice(to, 0, item);

    // Rebuild ID map to match new order
    const oldIds = Array.from({ length: value.length }, (_, i) => itemIds.current.get(i));
    const [movedId] = oldIds.splice(from, 1);
    oldIds.splice(to, 0, movedId);
    const newIds = new Map<number, string>();
    oldIds.forEach((id, i) => newIds.set(i, id || `sortable-${idCounter.current++}`));
    itemIds.current = newIds;

    onChange(newList);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder={placeholder || "Add item..."}
          className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 h-10 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((item, index) => (
            <li
              key={getItemId(index)}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group"
            >
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
                {index < value.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1 text-error-400 hover:text-error-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Key-Value List Component
const KeyValueList: React.FC<{
  value: { key: string; value: string }[];
  onChange: (value: { key: string; value: string }[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}> = ({ value = [], onChange, keyPlaceholder = "Name", valuePlaceholder = "Value" }) => {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const idCounter = useRef(0);
  const itemIds = useRef<Map<number, string>>(new Map());

  const getItemId = (index: number) => {
    if (!itemIds.current.has(index)) {
      itemIds.current.set(index, `kv-${idCounter.current++}`);
    }
    return itemIds.current.get(index)!;
  };

  const addItem = () => {
    if (newKey.trim()) {
      const newIndex = value.length;
      itemIds.current.set(newIndex, `kv-${idCounter.current++}`);
      onChange([...value, { key: newKey.trim(), value: newValue.trim() }]);
      setNewKey("");
      setNewValue("");
    }
  };

  const removeItem = (index: number) => {
    const newIds = new Map<number, string>();
    let newIdx = 0;
    value.forEach((_, i) => {
      if (i !== index) {
        newIds.set(newIdx++, itemIds.current.get(i) || `kv-${idCounter.current++}`);
      }
    });
    itemIds.current = newIds;
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={keyPlaceholder}
          className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder={valuePlaceholder}
          className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 h-10 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((item, index) => (
            <li
              key={getItemId(index)}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group"
            >
              <span className="font-medium text-sm text-gray-800 dark:text-white">{item.key}</span>
              {item.value && (
                <>
                  <span className="text-gray-400">:</span>
                  <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">{item.value}</span>
                </>
              )}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1 text-error-400 hover:text-error-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Person List Component
const PersonList: React.FC<{
  value: { name: string; title?: string; company?: string; bio?: string }[];
  onChange: (value: { name: string; title?: string; company?: string; bio?: string }[]) => void;
}> = ({ value = [], onChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: "", title: "", company: "", bio: "" });
  const idCounter = useRef(0);
  const itemIds = useRef<Map<number, string>>(new Map());

  const getItemId = (index: number) => {
    if (!itemIds.current.has(index)) {
      itemIds.current.set(index, `person-${idCounter.current++}`);
    }
    return itemIds.current.get(index)!;
  };

  const addPerson = () => {
    if (newPerson.name.trim()) {
      const newIndex = value.length;
      itemIds.current.set(newIndex, `person-${idCounter.current++}`);
      onChange([...value, { ...newPerson, name: newPerson.name.trim() }]);
      setNewPerson({ name: "", title: "", company: "", bio: "" });
      setShowForm(false);
    }
  };

  const removePerson = (index: number) => {
    const newIds = new Map<number, string>();
    let newIdx = 0;
    value.forEach((_, i) => {
      if (i !== index) {
        newIds.set(newIdx++, itemIds.current.get(i) || `person-${idCounter.current++}`);
      }
    });
    itemIds.current = newIds;
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((person, index) => (
            <div
              key={getItemId(index)}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-medium flex-shrink-0">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-white">{person.name}</p>
                {(person.title || person.company) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {[person.title, person.company].filter(Boolean).join(" at ")}
                  </p>
                )}
                {person.bio && (
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">{person.bio}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removePerson(index)}
                className="p-1 text-error-400 hover:text-error-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newPerson.name}
              onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
              placeholder="Name *"
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="text"
              value={newPerson.title}
              onChange={(e) => setNewPerson({ ...newPerson, title: e.target.value })}
              placeholder="Title/Role"
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <input
            type="text"
            value={newPerson.company}
            onChange={(e) => setNewPerson({ ...newPerson, company: e.target.value })}
            placeholder="Company/Organization"
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <textarea
            value={newPerson.bio}
            onChange={(e) => setNewPerson({ ...newPerson, bio: e.target.value })}
            placeholder="Short bio (optional)"
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addPerson}
              disabled={!newPerson.name.trim()}
              className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
            >
              Add Person
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:border-brand-500 hover:text-brand-500 transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm">Add Person</span>
        </button>
      )}
    </div>
  );
};

// Checklist Component
const Checklist: React.FC<{
  value: { text: string; completed: boolean }[];
  onChange: (value: { text: string; completed: boolean }[]) => void;
}> = ({ value = [], onChange }) => {
  const [newItem, setNewItem] = useState("");
  const idCounter = useRef(0);
  const itemIds = useRef<Map<number, string>>(new Map());

  const getItemId = (index: number) => {
    if (!itemIds.current.has(index)) {
      itemIds.current.set(index, `check-${idCounter.current++}`);
    }
    return itemIds.current.get(index)!;
  };

  const addItem = () => {
    if (newItem.trim()) {
      const newIndex = value.length;
      itemIds.current.set(newIndex, `check-${idCounter.current++}`);
      onChange([...value, { text: newItem.trim(), completed: false }]);
      setNewItem("");
    }
  };

  const toggleItem = (index: number) => {
    const newList = [...value];
    newList[index].completed = !newList[index].completed;
    onChange(newList);
  };

  const removeItem = (index: number) => {
    const newIds = new Map<number, string>();
    let newIdx = 0;
    value.forEach((_, i) => {
      if (i !== index) {
        newIds.set(newIdx++, itemIds.current.get(i) || `check-${idCounter.current++}`);
      }
    });
    itemIds.current = newIds;
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder="Add action item..."
          className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 h-10 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((item, index) => (
            <li
              key={getItemId(index)}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group"
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.completed
                    ? "bg-success-500 border-success-500 text-white"
                    : "border-gray-300 dark:border-gray-600 hover:border-brand-500"
                }`}
              >
                {item.completed && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.completed
                    ? "text-gray-400 line-through"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1 text-error-400 hover:text-error-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Multi-Select Component
const MultiSelect: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
  options: FieldOption[];
}> = ({ value = [], onChange, options }) => {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggleOption(option.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value.includes(option.value)
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {option.icon && <span className="mr-1">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
};

// Toggle Component
const Toggle: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}> = ({ value, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div>
        {label && <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">{label}</p>}
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          value ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
};

// Currency Input Component
const CurrencyInput: React.FC<{
  value: { amount: number; currency: string } | number | null;
  onChange: (value: { amount: number; currency: string }) => void;
}> = ({ value, onChange }) => {
  const amount = typeof value === "object" ? value?.amount : value;
  const currency = typeof value === "object" ? value?.currency : "USD";

  return (
    <div className="flex gap-2">
      <select
        value={currency || "USD"}
        onChange={(e) => onChange({ amount: amount || 0, currency: e.target.value })}
        className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >
        <option value="USD">USD</option>
        <option value="AED">AED</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="SAR">SAR</option>
      </select>
      <input
        type="number"
        value={amount || ""}
        onChange={(e) => onChange({ amount: parseFloat(e.target.value) || 0, currency: currency || "USD" })}
        placeholder="0.00"
        step="0.01"
        className="flex-1 h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
};

// Main Dynamic Field Component
export const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
}) => {
  const handleChange = (newValue: unknown) => {
    onChange(field.id, newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "url":
      case "phone":
        return (
          <Input
            type={field.type === "phone" ? "tel" : field.type}
            value={(value as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={(value as number) || ""}
            onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.validation?.min?.toString()}
            max={field.validation?.max?.toString()}
          />
        );

      case "textarea":
      case "rich-text":
        return (
          <TextArea
            value={(value as string) || ""}
            onChange={handleChange}
            placeholder={field.placeholder}
            rows={field.type === "rich-text" ? 5 : 3}
          />
        );

      case "select":
        return (
          <Select
            options={field.options || []}
            value={(value as string) || ""}
            onChange={handleChange}
            placeholder={field.placeholder || "Select..."}
          />
        );

      case "multiselect":
        return (
          <MultiSelect
            value={(value as string[]) || []}
            onChange={handleChange}
            options={field.options || []}
          />
        );

      case "toggle":
        return (
          <Toggle
            value={(value as boolean) || false}
            onChange={handleChange}
            description={field.description}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
          />
        );

      case "time":
        return (
          <Input
            type="time"
            value={(value as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
          />
        );

      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={(value as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
          />
        );

      case "sortable-list":
        return (
          <SortableList
            value={(value as string[]) || []}
            onChange={handleChange}
            placeholder={field.placeholder}
          />
        );

      case "key-value-list":
        return (
          <KeyValueList
            value={(value as { key: string; value: string }[]) || []}
            onChange={handleChange}
          />
        );

      case "person-list":
        return (
          <PersonList
            value={(value as { name: string; title?: string; company?: string; bio?: string }[]) || []}
            onChange={handleChange}
          />
        );

      case "checklist":
        return (
          <Checklist
            value={(value as { text: string; completed: boolean }[]) || []}
            onChange={handleChange}
          />
        );

      case "currency":
        return (
          <CurrencyInput
            value={value as { amount: number; currency: string } | number | null}
            onChange={handleChange}
          />
        );

      case "file":
        return (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-6 h-6 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {value
                    ? (value as string)
                    : field.validation?.fileTypes
                      ? `Accepted: ${field.validation.fileTypes.join(", ")}`
                      : "Click to upload"}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                disabled={disabled}
                accept={field.validation?.fileTypes?.map(t => `.${t}`).join(",")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Store the file name - the actual file handling is done by the form's submit handler
                    handleChange(file.name);
                  }
                }}
              />
            </label>
          </div>
        );

      case "color":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={(value as string) || "#6366f1"}
              onChange={(e) => handleChange(e.target.value)}
              className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
              disabled={disabled}
            />
            <input
              type="text"
              value={(value as string) || "#6366f1"}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              disabled={disabled}
            />
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  // Don't show label for toggle type (it's shown inside)
  if (field.type === "toggle") {
    return (
      <div className={field.fullWidth ? "col-span-2" : ""}>
        <Toggle
          value={(value as boolean) || false}
          onChange={(v) => handleChange(v)}
          label={field.label}
          description={field.description}
        />
        {error && <p className="mt-1 text-sm text-error-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className={field.fullWidth ? "col-span-2" : ""}>
      <Label htmlFor={field.id}>
        {field.label}
        {field.validation?.required && <span className="text-error-500 ml-1">*</span>}
        {field.adminOnly && (
          <span className="ml-2 text-xs text-purple-500 font-normal">(Admin only)</span>
        )}
      </Label>
      {field.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{field.description}</p>
      )}
      {renderField()}
      {error && <p className="mt-1 text-sm text-error-500">{error}</p>}
    </div>
  );
};

export default DynamicField;
