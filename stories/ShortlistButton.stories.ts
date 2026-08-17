import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import ShortlistButton from '../app/components/ShortlistButton.vue'

const meta: Meta<typeof ShortlistButton> = {
  title: 'Components/ShortlistButton',
  component: ShortlistButton,
  tags: ['autodocs'],
  args: {
    onToggle: fn()
  }
}

export default meta
type Story = StoryObj<typeof ShortlistButton>

export const Inactive: Story = {
  args: {
    active: false
  }
}

export const Active: Story = {
  args: {
    active: true
  }
}

export const Small: Story = {
  args: {
    active: false,
    size: 'sm'
  }
}

export const IconInactive: Story = {
  args: {
    active: false,
    variant: 'icon'
  }
}

export const IconActive: Story = {
  args: {
    active: true,
    variant: 'icon'
  }
}
