'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Section, SectionType, createSection } from '@/components/builder/sectionDefinitions'

export function useBuilder(pageSlug = 'home') {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['builder', pageSlug],
    queryFn: async () => {
      const { data } = await api.get(`/api/builder/page?pageSlug=${pageSlug}`)
      return (data.data?.sections ?? []) as Section[]
    },
  })

  const sections = data ?? []

  const saveMutation = useMutation({
    mutationFn: async (sections: Section[]) => {
      const { data } = await api.put('/api/builder/page', { pageSlug, sections })
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builder', pageSlug] }),
  })

  const addSection = useCallback((type: SectionType) => {
    const newSection = createSection(type, sections.length)
    const updated = [...sections, newSection]
    saveMutation.mutate(updated)
    setSelectedId(newSection.id)
  }, [sections, saveMutation])

  const removeSection = useCallback((id: string) => {
    const updated = sections
      .filter(s => s.id !== id)
      .map((s, i) => ({ ...s, order: i }))
    saveMutation.mutate(updated)
    if (selectedId === id) setSelectedId(null)
  }, [sections, saveMutation, selectedId])

  const updateSection = useCallback((id: string, props: Record<string, any>) => {
    const updated = sections.map(s => s.id === id ? { ...s, props: { ...s.props, ...props } } : s)
    saveMutation.mutate(updated)
  }, [sections, saveMutation])

  const reorderSections = useCallback((reordered: Section[]) => {
    const updated = reordered.map((s, i) => ({ ...s, order: i }))
    saveMutation.mutate(updated)
  }, [saveMutation])

  const duplicateSection = useCallback((id: string) => {
    const original = sections.find(s => s.id === id)
    if (!original) return
    const copy: Section = {
      ...original,
      id: `${original.type}-${Date.now()}`,
      order: sections.length,
      props: { ...original.props },
    }
    saveMutation.mutate([...sections, copy])
  }, [sections, saveMutation])

  const selectedSection = sections.find(s => s.id === selectedId) ?? null

  return {
    sections,
    isLoading,
    isSaving: saveMutation.isPending,
    selectedId,
    selectedSection,
    setSelectedId,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    duplicateSection,
  }
}
