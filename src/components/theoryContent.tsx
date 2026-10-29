import type { ReactNode } from 'react'
import { theoryContent } from './theoryDocument'

function inlineTheory(text: string): ReactNode {
  return text.replace(/\\\|/g, '|').split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  )
}
const keywords = /^(?:IF|ELSE|FOR|IN|RETURN|WHILE|BREAK|CONTINUE|true|false|function|if|for|return)$/i
function highlighted(line: string): ReactNode {
  const comment = line.indexOf('//'), content = comment >= 0 ? line.slice(0, comment) : line
  return <>{content.split(/([A-Za-z_][\w.]*)/g).map((token, index) => /^[A-Za-z_]/.test(token) ? <span className={keywords.test(token) ? 'code-keyword' : 'code-identifier'} key={index}>{token}</span> : token)}{comment >= 0 && <span className="code-comment">{line.slice(comment)}</span>}</>
}
export function TheoryCodeEditor({ code, title }: { code: string; title: string }) {
  return <figure className="theory-code-editor">
    <figcaption><span className="editor-lights" aria-hidden="true"><i /><i /><i /></span><span>{title.replace('Procedure part — ', '').replace('Definition part — ', '')}</span><span className="editor-kind">PSEUDOCODE</span></figcaption>
    <pre tabIndex={0} aria-label={`${title} 의사코드`}><code>{code.split('\n').map((line, index) => <span className="code-line" key={index}><span className="code-line-number" aria-hidden="true">{index + 1}</span><span className="code-text">{highlighted(line)}</span>{'\n'}</span>)}</code></pre>
  </figure>
}
const rawCells = (line: string) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(cell => cell.trim())

/** Safe, controlled Markdown renderer; no raw HTML or evaluated source. */
export function TheoryDocumentContent({ text, title = '알고리즘 이론', specification = false }: { text: string; title?: string; specification?: boolean }) {
  const lines = text.split(/\r?\n/), output: ReactNode[] = []
  let index = 0, heading = title
  while (index < lines.length) {
    const key = index, line = lines[index]
    if (!line.trim()) { index++; continue }
    if (line.startsWith('```')) {
      const language = line.slice(3).trim(), code: string[] = []; index++
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++])
      index++
      output.push(language === 'math'
        ? <div className="theory-math-block" role="math" aria-label={code.join('; ')} key={key}>{code.map((formula, formulaIndex) => <div key={formulaIndex}>{formula}</div>)}</div>
        : <TheoryCodeEditor code={code.join('\n')} title={heading} key={key} />)
      continue
    }
    const matched = /^(#{2,3}) (.+)$/.exec(line)
    if (matched) { heading = matched[2]; output.push(<h4 key={key}>{inlineTheory(heading)}</h4>); index++; continue }
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (index < lines.length && lines[index].startsWith('|')) rows.push(rawCells(lines[index++]))
      if (specification && rows[0]?.[0] === '항목') {
        output.push(<dl className="theory-spec" key={key}>{rows.slice(2).map((row, rowIndex) => <div key={rowIndex}><dt>{inlineTheory(row[0])}</dt><dd>{inlineTheory(row[1])}</dd></div>)}</dl>)
      } else {
        output.push(<div className="theory-table-scroll" role="region" aria-label={`${heading} 표 스크롤`} tabIndex={0} key={key}><table><caption>{heading}</caption><thead><tr>{rows[0].map((cell, cellIndex) => <th scope="col" key={cellIndex}>{inlineTheory(cell)}</th>)}</tr></thead><tbody>{rows.slice(2).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{inlineTheory(cell)}</th> : <td key={cellIndex}>{inlineTheory(cell)}</td>)}</tr>)}</tbody></table></div>)
      }
      continue
    }
    if (line.startsWith('- ')) {
      const items: string[] = []; while (index < lines.length && lines[index].startsWith('- ')) items.push(lines[index++].slice(2))
      output.push(<ul className="theory-list" key={key}>{items.map((item, itemIndex) => <li key={itemIndex}>{inlineTheory(item)}</li>)}</ul>); continue
    }
    const paragraph: string[] = [lines[index++]]
    while (index < lines.length && lines[index].trim() && !/^(#|\||```|- )/.test(lines[index])) paragraph.push(lines[index++])
    output.push(<p key={key}>{inlineTheory(paragraph.join(' '))}</p>)
  }
  return <div className="theory-doc">{output}</div>
}
export function CoreTheoryContent() { return <TheoryDocumentContent text={theoryContent} /> }
