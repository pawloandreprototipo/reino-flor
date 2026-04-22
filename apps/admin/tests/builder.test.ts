import {
  SECTION_DEFINITIONS,
  createSection,
  getSectionDefinition,
  SectionType,
} from '@/components/builder/sectionDefinitions'

describe('sectionDefinitions', () => {
  it('deve ter 5 tipos de seção definidos', () => {
    expect(SECTION_DEFINITIONS).toHaveLength(5)
  })

  it('deve conter todos os tipos esperados', () => {
    const types = SECTION_DEFINITIONS.map(d => d.type)
    expect(types).toContain('hero')
    expect(types).toContain('product_grid')
    expect(types).toContain('banner')
    expect(types).toContain('testimonials')
    expect(types).toContain('newsletter')
  })

  it('cada definição deve ter campos obrigatórios', () => {
    SECTION_DEFINITIONS.forEach(def => {
      expect(def.type).toBeTruthy()
      expect(def.label).toBeTruthy()
      expect(def.icon).toBeTruthy()
      expect(def.defaultProps).toBeDefined()
      expect(Array.isArray(def.fields)).toBe(true)
    })
  })
})

describe('createSection', () => {
  it('deve criar seção hero com props padrão', () => {
    const section = createSection('hero', 0)
    expect(section.type).toBe('hero')
    expect(section.order).toBe(0)
    expect(section.id).toContain('hero')
    expect(section.props.title).toBeTruthy()
    expect(section.props.buttonText).toBeTruthy()
  })

  it('deve criar seção product_grid com limit padrão', () => {
    const section = createSection('product_grid', 1)
    expect(section.type).toBe('product_grid')
    expect(section.props.limit).toBeGreaterThan(0)
  })

  it('deve gerar IDs únicos para seções do mesmo tipo', () => {
    const s1 = createSection('hero', 0)
    const s2 = createSection('hero', 1)
    expect(s1.id).not.toBe(s2.id)
  })

  it('deve criar seção newsletter com título e subtítulo', () => {
    const section = createSection('newsletter', 2)
    expect(section.props.title).toBeTruthy()
    expect(section.props.subtitle).toBeTruthy()
  })
})

describe('getSectionDefinition', () => {
  const types: SectionType[] = ['hero', 'product_grid', 'banner', 'testimonials', 'newsletter']

  types.forEach(type => {
    it(`deve retornar definição para tipo "${type}"`, () => {
      const def = getSectionDefinition(type)
      expect(def).toBeDefined()
      expect(def.type).toBe(type)
    })
  })
})
