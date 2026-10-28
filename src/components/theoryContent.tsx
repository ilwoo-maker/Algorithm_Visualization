import type { ReactNode } from 'react'
import { plain, cells, theoryContent } from './theoryDocument'

/** Small renderer for this controlled document's headings/tables/lists/code only.
 * Raw HTML is never executed; the Markdown remains the single theory source. */
function blocks(text: string): ReactNode[] {
  const lines = text.split(/\r?\n/), output: ReactNode[] = []
  let index = 0, heading = '알고리즘 이론'
  while (index < lines.length) {
    const key = index, line = lines[index]
    if (!line.trim()) { index++; continue }
    if (line.startsWith('```')) {
      const code: string[] = []; index++
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++])
      index++; output.push(<pre key={key}><code>{code.join('\n')}</code></pre>); continue
    }
    const title = /^(#{2,3}) (.+)$/.exec(line)
    if (title) {
      heading = plain(title[2]); output.push(title[1].length === 2 ? <h3 key={key}>{heading}</h3> : <h4 key={key}>{heading}</h4>); index++; continue
    }
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (index < lines.length && lines[index].startsWith('|')) rows.push(cells(lines[index++]))
      output.push(<table key={key}><caption>{heading}</caption><thead><tr>{rows[0].map((cell, i) => <th scope="col" key={i}>{cell}</th>)}</tr></thead><tbody>{rows.slice(2).map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table>); continue
    }
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (index < lines.length && lines[index].startsWith('- ')) items.push(plain(lines[index++].slice(2)))
      output.push(<ul key={key}>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>); continue
    }
    const paragraph: string[] = [plain(lines[index++])]
    while (index < lines.length && lines[index].trim() && !/^(#|\||```|- )/.test(lines[index])) paragraph.push(plain(lines[index++]))
    output.push(<p key={key}>{paragraph.join(' ')}</p>)
  }
  return output
}
const rendered = blocks(theoryContent)
export function CoreTheoryContent() {
  return <div className="core-theory">{theoryContent ? rendered : <p role="alert">이론 원본 문서를 확인해 주세요.</p>}</div>
}
