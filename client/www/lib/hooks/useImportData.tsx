import { getFilesWithExtension, getFilesWithFilename } from '../importdata';
import { Entry } from '@zip.js/zip.js';
import { useState, useEffect } from 'react';

import { InstantReactWeb, tx } from '@instantdb/react';
import { getFormattedTableData } from '@/lib/import/formatTable';
import { getFormattedUserData } from '../import/formatUser';
import { isArray, values } from 'lodash';
import { errorToast, successToast } from '../toast';
import {
  getFormattedElementType,
  getFormattedElementTypes,
} from '../import/formatElementTypes';

type Namespaces =
  | null
  | 'users'
  | 'pages'
  | 'tables'
  | 'elements'
  | 'elementTypes'
  | 'elementsToTables'
  | 'notes';

type Status = {
  message: 'not started' | 'in progress' | 'finished';
  namespace: Namespaces;
  progress: number;
  total: number;
};

type Result = {
  users: Array<any>;
  tables: Array<any>;
  notes: Array<any>;
  elementTypes: Array<any>;
  elements: Array<any>;
  elementsToTables: Array<any>;
  pages: Array<any>;
};

export default function useImportData(
  input: Entry[],
  db: InstantReactWeb<any, any>
) {
  async function migrate(
    entity: string,
    data: object,
    link: object | null,
    db: InstantReactWeb<any, any>
  ) {
    const steps = [tx[entity][data.id].update(data)];
    if (link) {
      Object.entries(link).map(([key, value]) => {
        value.map((val) => {
          const { entity: linkEntity, id, update } = val;
          steps.push(tx[linkEntity][id].update(update));
          steps.push(tx[entity][data.id].link({ linkEntity: val.id }));
        });
      });
    }
    await db.transact(steps).catch((err) => {
      errorToast(`${entity}: ${err.message}`);
    });
  }

  const order = {
    users: async () => {
      const targets = getFilesWithExtension(input, '.php');
      setStatus((status) => {
        return {
          ...status,
          message: 'in progress',
          namespace: 'users',
          total: status.total + targets.length,
        };
      });
      const res = await Promise.all(
        await targets.map(async (file) => {
          const { result: data, link } = await getFormattedUserData(file);
          setStatus((status) => {
            return {
              ...status,
              progress: status.progress + 1,
            };
          });
          await migrate('users', data, link, db);
          setResult((result) => {
            return { ...result, users: [...result.users, data] };
          });
        })
      );
      if (res) {
        setStatus((status) => {
          return {
            ...status,
            message: 'finished',
            namespace: 'users',
          };
        });
      }
    },
    pages: async () => {
      console.log('pages');
    },
    tables: async () => {
      const targets = getFilesWithFilename(input, 'table.txt');
      setStatus((status) => {
        return {
          ...status,
          message: 'in progress',
          namespace: 'tables',
          total: status.total + targets.length,
        };
      });
      if (result.users) {
        const res = await Promise.all(
          targets.map(async (file) => {
            const { result: data, link } = await getFormattedTableData(
              file,
              result.users
            );
            setStatus((status) => {
              return {
                ...status,
                message: 'in progress',
                progress: status.progress + 1,
              };
            });
            await migrate('tables', data, link, db);
            setResult((result) => {
              return { ...result, tables: [...result.tables, data] };
            });
          })
        );
        if (res) {
          setStatus((status) => {
            return {
              ...status,
              message: 'finished',
              namespace: 'tables',
            };
          });
        }
      }
    },
    elements: async () => {
      console.log('elements');
    },
    elementTypes: async () => {
      const data = getFormattedElementTypes();
      setStatus((status) => {
        return {
          ...status,
          message: 'in progress',
          namespace: 'elementTypes',
          total: status.total + data.length,
        };
      });
      const res = await Promise.all(
        data.map(async (entry) => {
          setStatus((status) => {
            return {
              ...status,
              message: 'in progress',
              progress: status.progress + 1,
            };
          });
          await migrate('elementTypes', entry, null, db);

          setResult((result) => {
            return { ...result, elementTypes: [...result.elementTypes, entry] };
          });
        })
      );
      if (res) {
        setStatus((status) => {
          return {
            ...status,
            message: 'finished',
            namespace: 'elementTypes',
          };
        });
      }
    },
    elementsToTables: () => {
      console.log('elements to tables');
    },
    notes: async () => {
      console.log('notes');
    },
  };

  const initStatus: Status = {
    message: 'not started',
    namespace: null,
    progress: 0,
    total: 0,
  };
  const initResult: Result = {
    users: [],
    tables: [],
    elements: [],
    elementTypes: [],
    elementsToTables: [],
    notes: [],
    pages: [],
  };

  const [status, setStatus] = useState<Status>(initStatus);
  const [result, setResult] = useState<Result>(initResult);

  useEffect(() => {
    if (status.namespace === 'users' && status.message === 'finished') {
      order.tables();
    }
    if (status.namespace === 'tables' && status.message === 'finished') {
      order.elementTypes();
    }
    if (status.namespace === 'elementTypes' && status.message === 'finished') {
      order.elements();
    }
    if (status.namespace === 'elements' && status.message === 'finished') {
      order.elementsToTables();
    }
    if (
      status.namespace === 'elementsToTables' &&
      status.message === 'finished'
    ) {
      order.notes();
    }
  }, [status]);

  useEffect(() => {
    setStatus(initStatus);
    setResult(initResult);

    async function processFiles() {
      setResult(initResult);
      await order.users();
    }

    if (input.length > 0) {
      processFiles();
    }
  }, [input]);

  return {
    result,
    status,
  };
}
