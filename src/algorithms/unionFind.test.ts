import { describe, expect, it } from 'vitest'
import { UnionFind } from './unionFind'

describe('Union-Find', () => {
  it('merges disjoint components and refuses cycle-forming unions', () => {
    const sets = new UnionFind(['A', 'B', 'C', 'D', 'E'])
    expect(sets.find('A')).not.toBe(sets.find('B'))
    expect(sets.union('B', 'C')).toBe(true)
    expect(sets.union('B', 'D')).toBe(true)
    expect(sets.union('A', 'B')).toBe(true)
    expect(sets.union('A', 'C')).toBe(false)
    expect(sets.find('A')).toBe(sets.find('D'))
    expect(sets.find('A')).not.toBe(sets.find('E'))
    expect(sets.union('B', 'E')).toBe(true)
    expect(sets.union('E', 'C')).toBe(false)
    expect(sets.union('A', 'A')).toBe(false)
  })

  it('handles repeated finds after balanced and sequential merges', () => {
    const vertices = Array.from({ length: 2048 }, (_, i) => String(i))
    const sets = new UnionFind(vertices)
    for (let width = 1; width < vertices.length; width *= 2) {
      for (let i = 0; i + width < vertices.length; i += width * 2) {
        expect(sets.union(vertices[i], vertices[i + width])).toBe(true)
      }
    }
    for (const vertex of vertices) expect(sets.find(vertex)).toBe(sets.find('0'))
    for (const vertex of vertices) expect(sets.union('0', vertex)).toBe(false)
  })

  it('fails explicitly for an unknown vertex instead of corrupting its parent map', () => {
    const sets = new UnionFind(['A'])
    expect(() => sets.find('missing')).toThrow(/정점/)
    expect(() => sets.union('A', 'missing')).toThrow(/정점/)
    expect(sets.find('A')).toBe('A')
  })
})
