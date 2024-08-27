import { Entry } from '@zip.js/zip.js';

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

/*
username: alexis-puget
firstname: Alexis
lastname: Puget
email: ""
password: >
  $2a$10$v.8RSGSXg6W8KcDFfrzW9eduHgVG76wz0L2AwPre7aa/FuKfNqp1G
language: fr
role: editor
history:
  - >
    elements/quis-hic-locus-quae-regio-quae-mundi-plaga
  - elements/le-miroir-comme-roman
  - elements/anthoine-et-christian
  - elements/loops-1-2
  - elements/crop-circle
*/
export function decodePHPContent(input: string) {
  if (!input) {
    return [];
  }
  // Handle array input
  if (Array.isArray(input)) {
    return input;
  }
}
