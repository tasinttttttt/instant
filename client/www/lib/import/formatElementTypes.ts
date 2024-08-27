import { id } from '@instantdb/react';

const templates = {
  'element-audio': 'audio',
  'element-carte': 'embed',
  'element-citation': 'quote',
  'element-hyperlien': 'link',
  'element-image': 'image',
  'element-video': 'external_video',
};

export function getFormattedElementTypes() {
  return Object.entries(templates).map(([key, value]) => {
    return {
      id: id(),
      name: value,
    };
  });
}
