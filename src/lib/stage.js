import { htmlToPlainText } from "./richText";

// A story's stage is no longer something the user sets by hand — it's
// evaluated from what's actually in the story, so it can't drift out of sync
// with real progress. "Published" is the one exception: whether a piece
// actually ran is something that happens outside the app, so it's the only
// stage a user still sets explicitly (story.published), and it overrides
// everything else once set.
export const STAGES = ["Research", "Interviewing", "Drafting", "Editing", "Published"];

const EDITING_WORD_THRESHOLD = 150;
const EDITING_LINKED_RATIO = 0.5;

export function computeStage(story) {
  if (story.published) return "Published";

  const blocks = story.draft?.blocks || [];
  const texts = blocks.map((b) => htmlToPlainText(b.html));
  const nonEmptyBlocks = blocks.filter((_, i) => texts[i].length > 0);
  const wordCount = texts.reduce((sum, t) => sum + (t ? t.split(/\s+/).length : 0), 0);
  const linkedBlocks = nonEmptyBlocks.filter((b) => b.links && b.links.length > 0);
  const linkedRatio = nonEmptyBlocks.length ? linkedBlocks.length / nonEmptyBlocks.length : 0;

  // Substantial, well-cited draft -> polishing/fact-checking phase.
  if (wordCount >= EDITING_WORD_THRESHOLD && linkedRatio >= EDITING_LINKED_RATIO) return "Editing";
  // Any real draft text at all -> actively writing.
  if (nonEmptyBlocks.length > 0) return "Drafting";
  // No draft yet, but at least one interview logged -> talking to sources.
  if ((story.interviews || []).length > 0) return "Interviewing";
  // Nothing above yet -> still gathering sources/documents/timeline.
  return "Research";
}
