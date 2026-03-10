import type {
  ComponentGroupRow,
  ComponentGroupNode,
  ResolvedComponentDefinition,
} from '@/components/registry/types'

// ── 그룹 트리 구축 (클라이언트/서버 공용 — server-only import 없음) ─────────

export function buildGroupTree(
  groups: ComponentGroupRow[],
  components: ResolvedComponentDefinition[]
): ComponentGroupNode[] {
  const nodeMap = new Map<string, ComponentGroupNode>()
  for (const g of groups) {
    nodeMap.set(g.id, {
      id: g.id,
      name: g.name,
      icon: g.icon,
      displayOrder: g.display_order,
      parentId: g.parent_id,
      children: [],
      components: [],
    })
  }

  const ungrouped: ResolvedComponentDefinition[] = []
  for (const comp of components) {
    if (comp.groupId && nodeMap.has(comp.groupId)) {
      nodeMap.get(comp.groupId)!.components.push(comp)
    } else {
      ungrouped.push(comp)
    }
  }

  for (const node of nodeMap.values()) {
    node.components.sort((a, b) => a.displayOrder - b.displayOrder)
  }

  const roots: ComponentGroupNode[] = []
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  for (const node of nodeMap.values()) {
    node.children.sort((a, b) => a.displayOrder - b.displayOrder)
  }
  roots.sort((a, b) => a.displayOrder - b.displayOrder)

  if (ungrouped.length > 0) {
    roots.push({
      id: '__ungrouped__',
      name: '미분류',
      icon: '📦',
      displayOrder: 9999,
      parentId: null,
      children: [],
      components: ungrouped,
    })
  }

  return roots
}

export function countGroupComponents(node: ComponentGroupNode): number {
  let count = node.components.length
  for (const child of node.children) {
    count += countGroupComponents(child)
  }
  return count
}
