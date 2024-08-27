import DOMPurify from 'dompurify';
import slugify from '@sindresorhus/slugify';
import { marked } from 'marked';
import { Entry, TextWriter } from '@zip.js/zip.js';
import { decodeContent } from '../importdata';
import { id } from '@instantdb/react';

const tableKeys = {
  title: {
    key: 'title',
    type: 'string',
    default: null,
  },
  text: {
    key: 'text',
    type: 'string',
    option: 'tohtml',
    default: null,
  },
  short_title: {
    key: 'abrege',
    type: 'string',
    default: null,
  },
  start_zoom: {
    key: 'scale',
    type: 'float',
    default: 0.0,
  },
  color: {
    key: 'couleur',
    type: 'string',
    default: null,
  },
  start_y: {
    key: 'top',
    type: 'float',
    default: 0.0,
  },
  start_x: {
    key: 'left',
    type: 'float',
    default: 0.0,
  },
  is_private: {
    key: 'status',
    cmp: {
      type: 'neq',
      value: 'public',
      default: true,
    },
    type: 'boolean',
    default: false,
  },
};

export async function getFormattedTableData(file: Entry, users: []) {
  const writer = new TextWriter();
  const raw = await file.getData(writer);
  const data = decodeContent(raw);
  var result = {};
  var link = {};
  marked.use({ breaks: true });

  Object.keys(tableKeys).forEach((key) => {
    if (data.hasOwnProperty(tableKeys[key].key)) {
      // Trim
      const val = data[tableKeys[key].key].trim();

      // Process compare
      if (tableKeys[key].hasOwnProperty('cmp')) {
        if (tableKeys[key].cmp.type === 'neq') {
          result[key] = val !== tableKeys[key].cmp.value;
        } else if (tableKeys[key].cmp.type === 'eq') {
          result[key] = val === tableKeys[key].cmp.value;
        } else {
          result[key] = tableKeys[key].cmp.default;
        }
      }

      // Convert to target type
      switch (tableKeys[key].type) {
        case 'float':
          result[key] = parseFloat(val);
          break;
        case 'string':
        default:
          result[key] = val;
      }

      // Process options
      if (tableKeys[key].hasOwnProperty('option')) {
        if (tableKeys[key].option === 'slug') {
          result[key] = slugify(result[key]);
        }
        if (tableKeys[key].option === 'tohtml') {
          result[key] = {
            type: 'text',
            content: DOMPurify.sanitize(marked.parse(result[key])),
          };
        }
      }
    } else {
      result[key] = tableKeys[key].default;
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
  link['tableUsers'] = [];
  if (data.hasOwnProperty('author')) {
    const match = users.find((user) => user.username === data.author);
    if (match) {
      link['tableUsers'].push({
        id: id(),
        entity: 'tableUsers',
        update: {
          is_author: true,
          user: match.id,
          table: result.id,
        },
      });
    }
  }
  if (data.hasOwnProperty('guests') && data.guests) {
    const guests = data.guests
      .split(',')
      .map((val: string) => val.trim())
      .filter((val) => val);
    const matches = users.filter((user) => guests.includes(user.username));
    if (matches) {
      link['tableUsers'] = [
        ...link['tableUsers'],
        ...matches.map((user) => {
          return {
            id: id(),
            entity: 'tableUsers',
            update: {
              is_author: false,
              user: user.id,
              table: result.id,
            },
          };
        }),
      ];
    }
  }

  return { result, link };
}
