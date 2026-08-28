"use client";

import { useState } from "react";

export default function SettingsToggle({ id, defaultChecked = false }: { id: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="relative inline-block w-11 mr-2 align-middle select-none transition duration-200 ease-in">
      <input
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer opacity-0"
        id={id}
        name={id}
        type="checkbox"
      />
      <label className="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer" htmlFor={id} />
      <div className="toggle-dot absolute block pointer-events-none" />
    </div>
  );
}
