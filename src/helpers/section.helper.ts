import { Section } from '../db/schema';

export function isFirstSectionGreaterThanOrSame(
  section1: Section,
  section2: Section,
) {
  if (section1.chapterId > section2.chapterId) {
    return true;
  }
  if (
    section1.chapterId == section2.chapterId &&
    section1.order >= section2.order
  ) {
    return true;
  }
}
