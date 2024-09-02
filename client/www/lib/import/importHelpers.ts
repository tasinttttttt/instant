import { Entry } from '@zip.js/zip.js';
import { jsonFetch } from '../fetch';
import config from '../config';

export function generateSlug(input: string) {
  return input
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .trim() // Trim spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .slice(0, 50); // Limit to 50 characters
}

export function getFilesWithFilename(files: Entry[], filename: string) {
  const matches = files.filter((file) =>
    file.filename.toLowerCase().endsWith(filename)
  );

  return matches;
}

export function getLastFolder(url: string) {
  const urlObj = new URL(url);
  const parts = urlObj.pathname.split('/').filter(Boolean);
  return parts.length > 1 && !parts[parts.length - 1].includes('.')
    ? parts[parts.length - 1]
    : parts[parts.length - 2];
}

export function getFilesInFileFolder(files: Entry[], filename: string) {
  const groupedFoldersWithAllContents = files.reduce((acc, entry) => {
    const parts = entry.filename.split('/').filter(Boolean);

    // Determine the last folder
    const lastFolderIndex =
      parts.length > 1 && !parts[parts.length - 1].includes('.')
        ? parts.length - 1
        : parts.length - 2;

    const lastFolder = parts[lastFolderIndex];

    // Get the file name if it exists
    const fileName =
      parts.length > 1 && parts[parts.length - 1].includes('.')
        ? parts[parts.length - 1]
        : null;

    // Initialize the folder's array if not already done
    if (!acc[lastFolder]) {
      acc[lastFolder] = [];
    }

    // If the file name matches, flag the folder as containing a matching file
    if (fileName) {
      const matches = files.filter((file) =>
        file.filename.toLowerCase().endsWith(filename)
      );
      if (matches.length) {
        acc[lastFolder].hasMatch = true;
      }
    }

    return acc;
  }, {});

  const result = Object.entries(groupedFoldersWithAllContents)
    .filter(([folder, contents]) => contents.hasMatch)
    .reduce((acc, [folder, contents]) => {
      acc[folder] = contents.filter((item) => typeof item === 'string');
      return acc;
    }, {});

  return result;
}

export function getFilesWithExtension(files: Entry[], ext: string) {
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().endsWith(ext)
  );
  filteredFiles.sort((a: Entry, b: Entry) =>
    a.filename.localeCompare(b.filename, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );

  return filteredFiles;
}

export function decodeContent(input: string) {
  // Handle null or empty string
  if (!input) {
    return [];
  }

  // Handle array input
  if (Array.isArray(input)) {
    return input;
  }

  // Check for string input
  if (typeof input !== 'string') {
    throw new Error('Invalid TXT data; please pass a string');
  }

  // Remove Unicode BOM
  if (input.startsWith('\uFEFF')) {
    input = input.substring(1);
  }

  let fields = [];
  // PHP!
  if (input.startsWith("<?php if(!defined('KIRBY')) exit ?>")) {
    fields = input.split('\n');
  } else {
    // Split fields by line separator
    fields = input.split('\n----\n');
  }

  // Initialize data array
  const data = {};

  // Iterate through fields
  for (const field of fields) {
    const pos = field.indexOf(':');

    if (pos !== -1) {
      const key = field
        .substring(0, pos)
        .trim()
        .toLowerCase()
        .replace(/-/g, '_')
        .replace(/ /g, '_');

      if (key) {
        const value = field.substring(pos + 1).trim();

        // Unescape escaped dividers
        data[key] = value.replace(/\\----/g, '----');
      }
    }
  }

  return data;
}

export function decodePHPContent(input: string) {
  if (!input) {
    return [];
  }
  // Handle array input
  if (Array.isArray(input)) {
    return input;
  }
}

async function upload(
  token: string,
  appId: string,
  file: File
): Promise<boolean> {
  const fileName = file.name;
  const { data: presignedUrl } = await jsonFetch(
    `${config.apiURI}/dash/apps/${appId}/storage/signed-upload-url`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ app_id: appId, filename: fileName }),
    }
  );

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  return response.ok;
}

export async function importSource(
  data: object,
  type: string,
  file: File | null
) {
  const upload = async (files: FileList) => {
    const file = files[0];
    const pathname = file.name; // or whatever custom file path you'd like
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
    const isSuccess = await db.storage.put(pathname, file);
    const cachedUrl = await db.storage.getDownloadUrl(pathname);

    db.transact(tx.images[id()].update({ cachedUrl, pathname, expiresAt }));
  };

  if (type === 'image' || type === 'pdf' || type === 'audio') {
    // if (data.hasOwnProperty('source') && data.source) {
    //   const bytes =
    //   const file = new File()
    //   const success = await upload(token, app.id, file)
    //   if ()
    // }
  }
}
