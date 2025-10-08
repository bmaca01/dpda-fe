import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Variant Rendering', () => {
    it('should render default variant with correct classes', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Click me' },
      })

      expect(wrapper.text()).toBe('Click me')
      expect(wrapper.classes()).toContain('bg-primary')
      expect(wrapper.classes()).toContain('text-primary-foreground')
    })

    it('should render destructive variant with correct classes', () => {
      const wrapper = mount(Button, {
        props: { variant: 'destructive' },
        slots: { default: 'Delete' },
      })

      expect(wrapper.classes()).toContain('bg-destructive')
      expect(wrapper.classes()).toContain('text-white')
    })

    it('should render outline variant with correct classes', () => {
      const wrapper = mount(Button, {
        props: { variant: 'outline' },
        slots: { default: 'Cancel' },
      })

      expect(wrapper.classes()).toContain('border')
      expect(wrapper.classes()).toContain('bg-background')
    })

    it('should render secondary variant with correct classes', () => {
      const wrapper = mount(Button, {
        props: { variant: 'secondary' },
        slots: { default: 'Secondary' },
      })

      expect(wrapper.classes()).toContain('bg-secondary')
      expect(wrapper.classes()).toContain('text-secondary-foreground')
    })

    it('should render ghost variant with correct classes', () => {
      const wrapper = mount(Button, {
        props: { variant: 'ghost' },
        slots: { default: 'Ghost' },
      })

      expect(wrapper.classes()).toContain('hover:bg-accent')
      expect(wrapper.classes()).toContain('hover:text-accent-foreground')
    })

    it('should render link variant with correct classes', () => {
      const wrapper = mount(Button, {
        props: { variant: 'link' },
        slots: { default: 'Link' },
      })

      expect(wrapper.classes()).toContain('text-primary')
      expect(wrapper.classes()).toContain('underline-offset-4')
    })
  })

  describe('Size Rendering', () => {
    it('should render default size with correct classes', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Button' },
      })

      expect(wrapper.classes()).toContain('h-9')
      expect(wrapper.classes()).toContain('px-4')
      expect(wrapper.classes()).toContain('py-2')
    })

    it('should render sm size with correct classes', () => {
      const wrapper = mount(Button, {
        props: { size: 'sm' },
        slots: { default: 'Small' },
      })

      expect(wrapper.classes()).toContain('h-8')
      expect(wrapper.classes()).toContain('px-3')
    })

    it('should render lg size with correct classes', () => {
      const wrapper = mount(Button, {
        props: { size: 'lg' },
        slots: { default: 'Large' },
      })

      expect(wrapper.classes()).toContain('h-10')
      expect(wrapper.classes()).toContain('px-6')
    })

    it('should render icon size with correct classes', () => {
      const wrapper = mount(Button, {
        props: { size: 'icon' },
        slots: { default: '🔍' },
      })

      expect(wrapper.classes()).toContain('size-9')
    })
  })

  describe('Base Classes', () => {
    it('should always include base utility classes', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Button' },
      })

      // Core button classes
      expect(wrapper.classes()).toContain('inline-flex')
      expect(wrapper.classes()).toContain('items-center')
      expect(wrapper.classes()).toContain('justify-center')
      expect(wrapper.classes()).toContain('rounded-md')
      expect(wrapper.classes()).toContain('text-sm')
      expect(wrapper.classes()).toContain('font-medium')
      expect(wrapper.classes()).toContain('transition-all')
    })

    it('should include disabled state classes', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Button' },
      })

      expect(wrapper.classes()).toContain('disabled:pointer-events-none')
      expect(wrapper.classes()).toContain('disabled:opacity-50')
    })

    it('should include focus-visible styles', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Button' },
      })

      expect(wrapper.classes()).toContain('outline-none')
      expect(wrapper.classes()).toContain('focus-visible:border-ring')
    })
  })

  describe('Custom Classes', () => {
    it('should merge custom classes with variant classes', () => {
      const wrapper = mount(Button, {
        props: {
          class: 'custom-class mt-4',
        },
        slots: { default: 'Button' },
      })

      // Should have both variant and custom classes
      expect(wrapper.classes()).toContain('bg-primary')
      expect(wrapper.classes()).toContain('custom-class')
      expect(wrapper.classes()).toContain('mt-4')
    })
  })

  describe('HTML Attributes', () => {
    it('should render as button element by default', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Button' },
      })

      expect(wrapper.element.tagName).toBe('BUTTON')
    })

    it('should support disabled attribute', () => {
      const wrapper = mount(Button, {
        attrs: { disabled: true },
        slots: { default: 'Disabled' },
      })

      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('should support type attribute', () => {
      const wrapper = mount(Button, {
        attrs: { type: 'submit' },
        slots: { default: 'Submit' },
      })

      expect(wrapper.attributes('type')).toBe('submit')
    })
  })

  describe('Slot Content', () => {
    it('should render text content', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Click me' },
      })

      expect(wrapper.text()).toBe('Click me')
    })

    it('should render HTML content', () => {
      const wrapper = mount(Button, {
        slots: { default: '<span>Nested</span>' },
      })

      expect(wrapper.html()).toContain('<span>Nested</span>')
    })
  })

  describe('Visual Regression Tests', () => {
    it('should render all variants without style conflicts', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const

      variants.forEach((variant) => {
        const wrapper = mount(Button, {
          props: { variant },
          slots: { default: variant },
        })

        // Verify no inline styles that could override Tailwind
        expect(wrapper.attributes('style')).toBeUndefined()

        // Verify classes are applied (not overridden by global CSS)
        expect(wrapper.classes().length).toBeGreaterThan(0)
      })
    })

    it('should not have conflicting background or text colors', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Test' },
      })

      const classes = wrapper.classes().join(' ')

      // Default variant should have both bg and text color
      expect(classes).toMatch(/bg-primary/)
      expect(classes).toMatch(/text-primary-foreground/)

      // Should NOT have conflicting inline styles
      expect(wrapper.attributes('style')).toBeUndefined()
    })
  })
})
