import DOMPurify from 'dompurify';
import slugify from '@sindresorhus/slugify';
import { marked } from 'marked';
import { Entry, TextWriter } from '@zip.js/zip.js';
import { decodeContent } from '../importdata';
import { id } from '@instantdb/react';

const elementKeys = {
  title: {
    key: 'title',
    type: 'string',
    default: null,
  },
  short_title: {
    key: 'abrege',
    type: 'string',
    default: null,
  },
  text: {
    key: 'text',
    type: 'string',
    option: 'tohtml', // markdown | tohtml
    default: null,
  },
  caption: {
    key: 'legende',
    type: 'string',
    option: 'tohtml', // markdown | tohtml
    default: null,
  },
  year: {
    key: 'year',
    type: 'int',
    default: null,
  },
  source: {
    key: 'source',
    type: 'string',
    default: null,
  },
  coords: {
    key: 'coords',
    type: null,
    default: null,
  },
};

export async function getFormattedElementData(file: Entry, users: []) {
  const writer = new TextWriter();
  const raw = await file.getData(writer);
  const data = decodeContent(raw);
  var result = {};
  var link = {};
  marked.use({ breaks: true });

  Object.keys(elementKeys).forEach((key) => {
    if (data.hasOwnProperty(elementKeys[key].key)) {
      // Trim
      const val = data[elementKeys[key].key].trim();

      // Process compare
      if (elementKeys[key].hasOwnProperty('cmp')) {
        if (elementKeys[key].cmp.type === 'neq') {
          result[key] = val !== elementKeys[key].cmp.value;
        } else if (elementKeys[key].cmp.type === 'eq') {
          result[key] = val === elementKeys[key].cmp.value;
        } else {
          result[key] = elementKeys[key].cmp.default;
        }
      }

      // Convert to target type
      switch (elementKeys[key].type) {
        case 'float':
          result[key] = parseFloat(val);
          break;
        case 'string':
        default:
          result[key] = val;
      }

      // Process options
      if (elementKeys[key].hasOwnProperty('option')) {
        if (elementKeys[key].option === 'slug') {
          result[key] = slugify(result[key]);
        }
        if (elementKeys[key].option === 'tohtml') {
          result[key] = {
            type: 'text',
            content: DOMPurify.sanitize(marked.parse(result[key])),
          };
        }
      }
    } else {
      result[key] = elementKeys[key].default;
    }
    if (data.hasOwnProperty('tags')) {
      result['tags'] = data.tags.split(',').map((val) => val.trim());
    }
    result['slug'] = slugify(data.title);
    result['id'] = id();
  });

  if (data.hasOwnProperty('creation')) {
    result['created_at'] =
      (data.creation && new Date(data.creation)) || new Date();
  }
  if (data.hasOwnProperty('modified')) {
    result['updated_at'] =
      (data.modified && new Date(data.modified)) || new Date();
  }

  link['users'] = [];
  if (data.hasOwnProperty('author')) {
    const match = users.find((user) => user.username === data.author);
    if (match) {
      link['users'].push({
        id: match.id,
      });
    }
  }

  return result;
}
