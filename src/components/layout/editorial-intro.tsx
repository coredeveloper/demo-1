// Reusable editorial intro pattern. A 7/5 col grid that pairs a display-typeface
// pull-quote (with an optional accent fragment) on the left with a small meta
// note on the right separated by a dotted rule. Used across /, /trends,
// /facilities, and /surveys/[id] so every page opens the same way.

import type { ReactNode } from "react";

type Props = {
  /** Optional small caps label above the headline. */
  eyebrow?: string;
  /** Headline body — pass children with an optional accented `<span>` fragment. */
  headline: ReactNode;
  /** Right-side meta note (dates, scope, etc.). */
  meta: ReactNode;
  /** Optional CTA / footnote line under the meta block. */
  metaCta?: ReactNode;
};

export function EditorialIntro({ eyebrow, headline, meta, metaCta }: Props) {
  return (
    <section className="mb-10 ph-reveal">
      <div className="grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 md:col-span-7">
          {eyebrow && <div className="ph-eyebrow mb-3">{eyebrow}</div>}
          <h2 className="text-[28px] leading-[1.18] tracking-tight text-ph-ink font-display font-medium">
            {headline}
          </h2>
        </div>
        <div className="col-span-12 md:col-span-4 md:col-start-9">
          <hr className="ph-rule mb-4" />
          <div className="text-sm leading-relaxed text-ph-gray-500">{meta}</div>
          {metaCta && <div className="mt-3">{metaCta}</div>}
        </div>
      </div>
    </section>
  );
}
