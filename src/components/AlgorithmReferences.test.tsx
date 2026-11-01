// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'

afterEach(cleanup)
it('keeps cited sources separate from the analysis and exposes their actual use and limits', () => {
  render(<App />)
  const references = within(screen.getByRole('region', { name: '참고자료 및 근거' }))
  expect(references.getByText(/기존 구현 참고/)).toBeDefined()
  expect(references.getByText(/추가 검증 자료/)).toBeDefined()
  expect(references.getByText(/초록·서지 확인/)).toBeDefined()
  expect(references.getByText(/프로젝트 자체 분석/)).toBeDefined()
  for (const link of references.getAllByRole('link')) {
    expect(link.getAttribute('href')).toMatch(/^https:\/\//)
    expect(link.getAttribute('rel')).toContain('noopener')
  }
  fireEvent.click(screen.getByRole('tab', { name: '복잡도 분석' }))
  expect(references.getByRole('link', { name: /BreadthFirstPaths/ })).toBeDefined()
  fireEvent(window, new Event('beforeprint'))
  expect(references.getByText(/algo4.pdf/)).toBeDefined()
  fireEvent(window, new Event('afterprint'))
})
