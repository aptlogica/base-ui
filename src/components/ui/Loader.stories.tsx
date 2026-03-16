import type { Meta, StoryObj } from '@storybook/react';
import { Loader } from './Loader';

const meta: Meta<typeof Loader> = {
  title: 'UI/Loader',
  component: Loader,
  args: {
    text: 'Loading data...',
    size: 10,
    textPosition: 'right',
  },
  argTypes: {
    textPosition: {
      control: 'inline-radio',
      options: ['top', 'right', 'bottom', 'left'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {};

export const WithTopLabel: Story = {
  args: {
    textPosition: 'top',
    text: 'Fetching workspaces...',
  },
};

export const Compact: Story = {
  args: {
    text: '',
    size: 6,
    dotGap: '0.25rem',
  },
};
