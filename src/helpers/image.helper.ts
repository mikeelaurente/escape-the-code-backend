import config from '../config/config';

export function resolveImage(imageName: string, type: 'avatar' | 'banner') {
  return `${config.domainName}/${type}s/${imageName}`;
}

export const resolveAvatar = (imageName: string) =>
  resolveImage(imageName, 'avatar');

export const resolveBanner = (imageName: string) =>
  resolveImage(imageName, 'banner');
