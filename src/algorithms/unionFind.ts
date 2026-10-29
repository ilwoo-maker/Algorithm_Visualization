/** Consumes validated unique vertices. Path compression + union by rank. */
export class UnionFind {
  readonly #parent = new Map<string, string>()
  readonly #rank = new Map<string, number>()

  constructor(vertices: readonly string[]) {
    for (const vertex of vertices) {
      this.#parent.set(vertex, vertex)
      this.#rank.set(vertex, 0)
    }
  }

  find(vertex: string): string {
    if (!this.#parent.has(vertex)) throw new RangeError(`등록되지 않은 정점입니다: ${vertex}`)
    let root = vertex
    while (this.#parent.get(root) !== root) root = this.#parent.get(root)!
    // Two passes compress the whole path without recursion or extra stack space.
    let current = vertex
    while (current !== root) {
      const next = this.#parent.get(current)!
      this.#parent.set(current, root)
      current = next
    }
    return root
  }

  union(a: string, b: string): boolean {
    let rootA = this.find(a)
    let rootB = this.find(b)
    if (rootA === rootB) return false
    const rankA = this.#rank.get(rootA)!
    const rankB = this.#rank.get(rootB)!
    if (rankA < rankB) [rootA, rootB] = [rootB, rootA]
    this.#parent.set(rootB, rootA)
    if (rankA === rankB) this.#rank.set(rootA, rankA + 1)
    return true
  }
}
