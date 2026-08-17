import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import SearchBar from '../app/components/SearchBar.vue'

const meta: Meta<typeof SearchBar> = {
  title: 'Components/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  args: {
    onSearch: fn()
  }
}

export default meta
type Story = StoryObj<typeof SearchBar>

export const Empty: Story = {
  args: {
    modelValue: '',
    loading: false
  }
}

export const WithQuery: Story = {
  args: {
    modelValue: 'Dune',
    loading: false
  }
}

export const Loading: Story = {
  args: {
    modelValue: 'Dune',
    loading: true
  }
}
