import { id } from '@instantdb/react';

export const elementTypes = {
  'element-audio': 'audio',
  'element-carte': 'embed',
  'element-citation': 'quote',
  'element-hyperlien': 'link',
  'element-image': 'image',
  'element-video': 'external_video',
};

export function getFormattedElementTypes() {
  return Object.entries(elementTypes).map(([key, value]) => {
    return {
      id: id(),
      name: value,
    };
  });
}
