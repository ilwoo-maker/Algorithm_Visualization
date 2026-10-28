// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import App from './App'
afterEach(cleanup)
it('orders four distinct sections with direct Lab and Theory navigation', () => {
  render(<App />)
  const regions = ['MST 도입', '알고리즘 개념 비교', 'Algorithm Lab', '이론과 비교'].map(name => screen.getByRole('region', { name }))
  for (let i = 1; i < regions.length; i++) expect(regions[i - 1].compareDocumentPosition(regions[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Algorithm Lab 바로가기' }).getAttribute('href')).toBe('#comparison')
  expect(screen.getByRole('link', { name: '이론 바로가기' }).getAttribute('href')).toBe('#theory')
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
})
it('reuses both existing panels and keeps final results independent of the introduction', () => {
  render(<App />)
  const lab = within(screen.getByRole('region', { name: 'Algorithm Lab' }))
  for (const name of ['Kruskal', 'Reverse-Delete']) {
    const panel = within(lab.getByRole('region', { name }))
    expect(panel.getByRole('button', { name: '다음' })).toBeDefined()
    expect(panel.getByRole('button', { name: '재생' })).toBeDefined()
  }
  expect(screen.getByRole('region', { name: '샘플 그래프의 최종 실행 결과' })).toBeDefined()
})
