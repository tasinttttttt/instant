import { getFilesWithFilename } from '../importdata';
import { Entry } from '@zip.js/zip.js';
import { useState, useEffect } from 'react';

import { InstantReactWeb, tx } from '@instantdb/react';
import { errorToast } from '@/lib/toast';
import { getFormattedTableData } from '@/lib/import/formatTable';

export default function useImportTables(
  input: Entry[],
  db: InstantReactWeb<any, any>
) {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState([]);
  const [files, setFiles] = useState<Entry[]>([]);

  useEffect(() => {
    setTotal(0);
    setProgress(0);
    setResult([]);
    const newFiles = getFilesWithFilename(input, 'table.txt');
    setFiles(newFiles);
  }, [input]);

  useEffect(() => {
    async function migrate(tableData, db: InstantReactWeb<any, any>) {
      await db.transact(tx['tables'][tableData.id].update(tableData));
    }

    async function treatFiles(files: Entry[]) {
      if (files.length === 0) {
        console.log('No files to process');
        return;
      }
      setTotal(files.length);
      setProgress(0);

      try {
        files.map(async (file) => {
          const tableData = await getFormattedTableData(file);
          setProgress((progress) => progress + 1);
          setResult((result) => [...result, tableData]);
          return migrate(tableData, db);
        });
      } catch (error) {
        errorToast(error);
        console.error(error);
      }
    }

    if (files.length > 0 && data) {
      console.log(data);
      // treatFiles(files);
    }
  }, [files, data]);

  return {
    files,
    result,
    total,
    progress,
  };
}
