import config from '../config/config';

export function resolveImage(
  imageName: string,
  type: 'avatar' | 'banner' | 'course' | 'achievement' | 'section' | 'chapter',
): string {
  if (['chapter', 'section'].includes(type)) {
    type = 'course';
  }
  console.log('Original image name:', imageName);
  console.log('Image type:', type);
  imageName = imageName.replace(`/uploads/${type}s/`, '');
  console.log(
    'Resolved image:',
    `${config.domainName}/uploads/${type}s/${imageName}`,
  );

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
