"use client";
import CustomDropdown from "@/components/ui/CustomDropdown";

type Option = {
  value: string;
  label: string;
};

type MonthDropdownProps = {
  value: string;
  options: Option[];
  onChange: (next: string) => void;
  width?: number;
};

export default function MonthDropdown({ value, options, onChange, width = 240 }: MonthDropdownProps) {
  return <CustomDropdown value={value} options={options} onChange={onChange} width={width} placeholder="All months" />;
}
