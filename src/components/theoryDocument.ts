import source from '../../docs/mst-lecture.md?raw'
export const plain = (text: string) => text.replace(/\*\*|`/g, '').replace(/\\\|/g, '|')
export const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(cell => plain(cell.trim()))
const start = source.indexOf('## 의사코드'), end = source.indexOf('## 검증 방법')
export const theoryContent = start >= 0 && end > start ? source.slice(start, end) : ''
const headings = [...theoryContent.matchAll(/^#{2,3} .+$/gm)]
/** Raw slices stay lossless: all definitions, helpers and cost caveats remain available. */
export const theoryGroups = headings.map((match, index) => {
  const raw = theoryContent.slice(match.index, headings[index + 1]?.index ?? theoryContent.length)
  return { title: match[0].replace(/^#+ /, '').trim(), body: raw.slice(raw.indexOf('\n') + 1), raw }
})
export function documentedCost(label: string, algorithm: 'kruskal' | 'reverse-delete') {
  const row = source.split(/\r?\n/).find(line => line.startsWith('|') && line.includes(label))
  return row ? cells(row)[algorithm === 'kruskal' ? 1 : 2] : '문서 확인 필요'
}
