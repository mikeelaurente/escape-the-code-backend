import fs from 'fs/promises';
import path from 'path';

let rootPath = '';

export function setRootPath(path: string) {
  rootPath = path;
}

export async function getTemplateContent(fileName: string) {
  try {
    const templateFile = path.resolve(
      path.join(rootPath, 'templates', fileName),
    );
    console.log('##### TEMPLATE FILE #####', templateFile);
    const stat = await fs.lstat(templateFile);
    if (!stat || !stat.isFile()) {
      return null;
    }
    const content = await fs.readFile(templateFile, { encoding: 'utf-8' });
    return content;
  } catch (e) {
    console.log(e);
    return null;
  }
}
