"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "./LocaleProvider";
export default function LocaleLink(props: ComponentProps<typeof Link>) {
  const { href } = useLocale();
  return <Link {...props} href={typeof props.href === "string" ? href(props.href) : props.href} />;
}
