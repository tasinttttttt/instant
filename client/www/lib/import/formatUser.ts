import DOMPurify from 'dompurify';
import slugify from '@sindresorhus/slugify';
import { marked } from 'marked';
import { Entry, TextWriter } from '@zip.js/zip.js';
import { decodeContent } from '../importdata';
import { id } from '@instantdb/react';

const userKeys = {
  username: {
    key: 'username',
    type: 'string',
    default: null,
  },
};

export async function getFormattedUserData(file: Entry) {
  const writer = new TextWriter();
  const raw = await file.getData(writer);
  const data = decodeContent(raw);
  var result = {};
  marked.use({ breaks: true });

  Object.keys(userKeys).forEach((key) => {
    if (data.hasOwnProperty(userKeys[key].key)) {
      // Trim
      const val = data[userKeys[key].key].trim();

      // Process compare
      if (userKeys[key].hasOwnProperty('cmp')) {
        if (userKeys[key].cmp.type === 'neq') {
          result[key] = val !== userKeys[key].cmp.value;
        } else if (userKeys[key].cmp.type === 'eq') {
          result[key] = val === userKeys[key].cmp.value;
        } else {
          result[key] = userKeys[key].cmp.default;
        }
      }

      // Convert to target type
      switch (userKeys[key].type) {
        case 'float':
          result[key] = parseFloat(val);
          break;
        case 'string':
        default:
          result[key] = val;
      }

      // Process options
      if (userKeys[key].hasOwnProperty('option')) {
        if (userKeys[key].option === 'slug') {
          result[key] = slugify(result[key]);
        }
        if (userKeys[key].option === 'tohtml') {
          result[key] = {
            type: 'text',
            content: DOMPurify.sanitize(marked.parse(result[key])),
          };
        }
      }
    } else {
      result[key] = userKeys[key].default;
    }
  });

  result['name'] = [];
  result.name.push(data.firstname, data.lastname);

  result['name'] =
    result.name
      .map((val: string) => val)
      .join(' ')
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '') || 'sans-nom';
  result['email'] = data['email'] || null;
  result['id'] = id();
  result['enabled_at'] = new Date();

  if (data.hasOwnProperty('creation')) {
    result['created_at'] =
      (data.creation && new Date(data.creation)) || new Date();
  }
  if (data.hasOwnProperty('modified')) {
    result['updated_at'] =
      (data.modified && new Date(data.modified)) || new Date();
  }

  return { result, link: null };
}
