"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

export type DropdownOption = {
  value: string;
  label: string;
};

type CustomDropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (next: string) => void;
  width?: number;
  placeholder?: string;
};

export default function CustomDropdown({ value, options, onChange, width = 240, placeholder = "Select" }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const active = useMemo(() => options.find((o) => o.value === value), [options, value]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width, maxWidth: "100%" }}>
      <button type="button" onClick={() => setOpen((x) => !x)} style={triggerBtn}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active?.label || placeholder}</span>
        <FaChevronDown style={{ fontSize: 11, color: "var(--muted)" }} />
      </button>

      {open && (
        <div style={menu}>
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  ...itemBtn,
                  background: selected ? "var(--primary-soft)" : "transparent",
                  color: selected ? "var(--primary)" : "var(--text)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const triggerBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: 13,
  padding: "9px 10px",
  cursor: "pointer",
};

const menu: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  zIndex: 70,
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 6,
  maxHeight: 270,
  overflowY: "auto",
  boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
};

const itemBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "1px solid transparent",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  cursor: "pointer",
};

