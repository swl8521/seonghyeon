"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "./LocaleProvider";
import { isLocale } from "@/lib/locale";
export default function LocaleLink(props: ComponentProps<typeof Link>) {
  const { href } = useLocale();
  const path = props.href;
  const explicit = typeof path === "string" && isLocale(new URL(path, "https://local.invalid").searchParams.get("lang"));
  return <Link {...props} href={typeof path === "string" && !explicit ? href(path) : path} />;
}
