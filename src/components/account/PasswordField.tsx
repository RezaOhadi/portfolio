"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./account.module.css";

/** One password box with a show/hide eye. There is never a "confirm" field. */
export function PasswordField({
  id,
  label = "Password",
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••",
  minLength,
  hint,
  labelRight,
  invalid,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
  hint?: ReactNode;
  labelRight?: ReactNode;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        {labelRight}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          name="password"
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className={`${styles.input} ${styles.withTrailing}`}
        />
        <button
          type="button"
          className={styles.eye}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
