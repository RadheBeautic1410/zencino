import { Fragment } from "react";
import { order } from "@/components/store/motion";

/**
 * A line split for the word-by-word entrance. Goes inside a `.reveal-words`
 * element; `start` continues the stagger from an earlier line.
 */
export function RevealWords({
  start = 0,
  text,
}: {
  start?: number;
  text: string;
}) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: a line can repeat a word, and the text never reorders.
      <Fragment key={index}>
        <span className="word" style={order(start + index)}>
          {word}
        </span>{" "}
      </Fragment>
    ));
}
