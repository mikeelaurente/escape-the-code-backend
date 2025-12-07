import config from '../config/config';

export function resolveImage(
  imageName: string,
  type:
    | 'avatar'
    | 'banner'
    | 'course'
    | 'achievement'
    | 'section-achievement'
    | 'section'
    | 'chapter',
): string {
  if (['chapter', 'section', 'section-achievement'].includes(type)) {
    type = 'course';
  }
  imageName = imageName.replace(`/uploads/${type}s/`, '');
  imageName = imageName.replace(/^\//, '');

  return `${config.domainName}/uploads/${type}s/${imageName}`;
}

export const resolveChapterImage = (imageName: string | 'default') => {
  if (imageName == 'default') {
    return `${config.domainName}/uploads/default/default-chapter.png`;
  }
  return resolveImage(imageName, 'chapter');
};

export const resolveSectionImage = (imageName: string | 'default') => {
  if (imageName == 'default') {
    return `${config.domainName}/uploads/default/default-section.png`;
  }
  return resolveImage(imageName, 'section');
};

export const resolveCourseImage = (imageName: string | 'default') => {
  if (imageName == 'default') {
    return `${config.domainName}/uploads/default/default-course.png`;
  }
  return resolveImage(imageName, 'course');
};

export const resolveAchievementImage = (imageName: string | 'default') => {
  if (imageName == 'default') {
    return `${config.domainName}/uploads/default/default-achievement.png`;
  }
  return resolveImage(imageName, 'achievement');
};

export const resolveSectionAchievementImage = (
  imageName: string | 'default',
) => {
  if (imageName == 'default') {
    return `${config.domainName}/uploads/default/default-achievement.png`;
  }
  return resolveImage(imageName, 'section-achievement');
};

export const resolveAvatar = (imageName: string | 'default') => {
  if (imageName == 'default') {
    return `${config.domainName}/uploads/default/default-avatar.png`;
  }
  return resolveImage(imageName, 'avatar');
};

export const resolveBanner = (imageName: string | 'default') => {
  if (imageName == 'default') {
    return `${config.domainName}/uploads/default/default-banner.png`;
  }
  return resolveImage(imageName, 'banner');
};
