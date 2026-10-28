import source from '../../docs/mst-core.md?raw'
export const plain = (text: string) => text.replace(/\*\*|`/g, '').replace(/\\\|/g, '|')
export const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(cell => plain(cell.trim()))
const start = source.indexOf('## 의사코드'), end = source.indexOf('## 검증 방법')
export const theoryContent = start >= 0 && end > start ? source.slice(start, end) : ''
export function documentedCost(label: string, algorithm: 'kruskal' | 'reverse-delete') {
  const row = source.split(/\r?\n/).find(line => line.startsWith('|') && line.includes(label))
  return row ? cells(row)[algorithm === 'kruskal' ? 1 : 2] : '문서 확인 필요'
}
