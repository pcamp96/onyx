"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, label = "Copy", className }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" variant="secondary" className={className} onClick={onCopy}>
      {copied ? "Copied" : label}
    </Button>
  );
}
