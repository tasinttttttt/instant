import { SectionHeading, Button, Content } from '@/components/ui';
import { jsonFetch } from '@/lib/fetch';
import React, { useEffect, useState } from 'react';
import { errorToast, successToast } from '@/lib/toast';
import { Loading, ErrorMessage } from '@/components/dash/shared';
import { TokenContext } from '@/lib/contexts';
import * as zip from '@zip.js/zip.js';
import useImportTables from '@/lib/hooks/useImportTables';
import { setDayOfYear } from 'date-fns';
import { InstantReactWeb } from '@instantdb/react';
import useImportData from '@/lib/hooks/useImportData';

function ProgressBar({ width }: { width: number }) {
  return (
    <div className="h-1.5 relative overflow-hidden rounded-full bg-neutral-200">
      <div
        style={{ width: `${width}%` }}
        className="absolute top-0 left-0 h-full bg-indigo-500"
      />
    </div>
  );
}

async function loadFiles(zipFile: File) {
  if (zipFile) {
    const zipReader = new zip.ZipReader(new zip.BlobReader(zipFile));
    const entries = await zipReader.getEntries();
    zipReader.close();
    return entries;
  }
}

export default function ImportData({ db }: { db: InstantReactWeb<any, any> }) {
  const [files, setFiles] = useState<zip.Entry[]>([]);
  const { result, status } = useImportData(files, db);
  // const { result, progress, total } = useImportTables(files, db);

  async function onImport(e: React.FormEvent) {
    e.preventDefault();
    const newFiles = await loadFiles(e.target?.[0].files[0]);
    if (newFiles) {
      setFiles(newFiles);
    } else {
      setFiles([]);
    }
  }

  useEffect(() => {
    if (
      status.message === 'finished' &&
      status.total > 0 &&
      status.progress >= status.total
    ) {
      successToast(`Successfully imported ${status.namespace} data`);
    }
  }, [status]);

  return (
    <div className="flex flex-col p-4 gap-4 max-w-md">
      <SectionHeading>Import Data</SectionHeading>
      <div className="flex flex-col gap px-2 pt-1 pb-3 rounded border">
        <h2 className="flex gap-2 p-2 justify-between">
          <span className="font-bold">Status</span>{' '}
          {`${status.progress} / ${status.total}`}
        </h2>
        <ProgressBar
          width={
            (status.total > 0 &&
              Math.round((status.progress / status.total) * 100)) ||
            0
          }
        />
      </div>
      <form onSubmit={onImport} className="flex flex-col gap-2">
        <input type="file" />
        <Button variant="primary" type="submit">
          Import data
        </Button>
        {status.message === 'in progress' && (
          <div>{`Importing ${status.namespace}...`}</div>
        )}

        <div className="flex flex-col gap-4">
          {result &&
            Object.entries(result).map(
              ([namespace, entries]) =>
                entries.length > 0 && (
                  <div key={namespace}>
                    <div className="font-bold">{namespace}</div>
                    <div className="flex flex-col flex-wrap gap-0 text-xs">
                      {entries &&
                        entries.map((entry) => (
                          <div key={entry.id}>{entry.title ?? entry.name}</div>
                        ))}
                    </div>
                  </div>
                )
            )}
        </div>
      </form>
    </div>
  );
}
