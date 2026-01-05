/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Font Families
      fontFamily: {
        body: 'var(--font-body)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },

      // Font Sizes with Line Heights
      fontSize: {
        'xs': ['var(--text-xs)', { lineHeight: 'var(--text-xs--line-height)' }],
        'sm': ['var(--text-sm)', { lineHeight: 'var(--text-sm--line-height)' }],
        'md': ['var(--text-md)', { lineHeight: 'var(--text-md--line-height)' }],
        'lg': ['var(--text-lg)', { lineHeight: 'var(--text-lg--line-height)' }],
        'xl': ['var(--text-xl)', { lineHeight: 'var(--text-xl--line-height)' }],
        'display-xs': ['var(--text-display-xs)', { lineHeight: 'var(--text-display-xs--line-height)' }],
        'display-sm': ['var(--text-display-sm)', { lineHeight: 'var(--text-display-sm--line-height)' }],
        'display-md': ['var(--text-display-md)', { lineHeight: 'var(--text-display-md--line-height)', letterSpacing: 'var(--text-display-md--letter-spacing)' }],
        'display-lg': ['var(--text-display-lg)', { lineHeight: 'var(--text-display-lg--line-height)', letterSpacing: 'var(--text-display-lg--letter-spacing)' }],
        'display-xl': ['var(--text-display-xl)', { lineHeight: 'var(--text-display-xl--line-height)', letterSpacing: 'var(--text-display-xl--letter-spacing)' }],
        'display-2xl': ['var(--text-display-2xl)', { lineHeight: 'var(--text-display-2xl--line-height)', letterSpacing: 'var(--text-display-2xl--letter-spacing)' }],
      },

      // Max Width
      maxWidth: {
        'container': 'var(--max-width-container)',
      },

      // Breakpoints
      screens: {
        'xxs': 'var(--breakpoint-xxs)',
        'xs': 'var(--breakpoint-xs)',
      },

      // Border Radius
      borderRadius: {
        'none': 'var(--radius-none)',
        'xs': 'var(--radius-xs)',
        'sm': 'var(--radius-sm)',
        'DEFAULT': 'var(--radius-DEFAULT)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        'full': 'var(--radius-full)',
      },

      // Box Shadows
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        '3xl': 'var(--shadow-3xl)',
        'skeumorphic': 'var(--shadow-skeumorphic)',
        'xs-skeumorphic': 'var(--shadow-xs-skeumorphic)',
        'modern-mockup-inner-lg': 'var(--shadow-modern-mockup-inner-lg)',
        'modern-mockup-inner-md': 'var(--shadow-modern-mockup-inner-md)',
        'modern-mockup-inner-sm': 'var(--shadow-modern-mockup-inner-sm)',
        'modern-mockup-outer-lg': 'var(--shadow-modern-mockup-outer-lg)',
        'modern-mockup-outer-md': 'var(--shadow-modern-mockup-outer-md)',
      },

      // Drop Shadow
      dropShadow: {
        'iphone-mockup': 'var(--drop-shadow-iphone-mockup)',
      },

      // Animations
      animation: {
        'marquee': 'var(--animate-marquee)',
        'caret-blink': 'var(--animate-caret-blink)',
      },

      // Colors
      colors: {
        // Base colors
        transparent: 'var(--color-transparent)',
        white: 'var(--color-white)',
        black: 'var(--color-black)',
        
        // Alpha colors (theme-aware)
        'alpha-white': 'var(--color-alpha-white)',
        'alpha-black': 'var(--color-alpha-black)',

        // Brand colors
        brand: {
          25: 'var(--color-brand-25)',
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          950: 'var(--color-brand-950)',
        },

        // Error colors
        error: {
          25: 'var(--color-error-25)',
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
          950: 'var(--color-error-950)',
        },

        // Warning colors
        warning: {
          25: 'var(--color-warning-25)',
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
          950: 'var(--color-warning-950)',
        },

        // Success colors
        success: {
          25: 'var(--color-success-25)',
          50: 'var(--color-success-50)',
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
          300: 'var(--color-success-300)',
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
          800: 'var(--color-success-800)',
          900: 'var(--color-success-900)',
          950: 'var(--color-success-950)',
        },

        // Gray colors
        gray: {
          25: 'var(--color-gray-25)',
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
          950: 'var(--color-gray-950)',
        },

        // Red colors (mapped to error for semantic consistency)
        red: {
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
          950: 'var(--color-error-950)',
        },

        // Green colors (mapped to success for semantic consistency)
        green: {
          50: 'var(--color-success-50)',
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
          300: 'var(--color-success-300)',
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
          800: 'var(--color-success-800)',
          900: 'var(--color-success-900)',
          950: 'var(--color-success-950)',
        },

        // Yellow colors (mapped to warning for semantic consistency)
        yellow: {
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
          950: 'var(--color-warning-950)',
        },

        // Blue colors
        blue: {
          50: 'var(--color-blue-50)',
          100: 'var(--color-blue-100)',
          200: 'var(--color-blue-200)',
          300: 'var(--color-blue-300)',
          400: 'var(--color-blue-400)',
          500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)',
          700: 'var(--color-blue-700)',
          800: 'var(--color-blue-800)',
          900: 'var(--color-blue-900)',
          950: 'var(--color-blue-950)',
        },

        // Orange colors
        orange: {
          50: 'var(--color-orange-50)',
          100: 'var(--color-orange-100)',
          200: 'var(--color-orange-200)',
          300: 'var(--color-orange-300)',
          400: 'var(--color-orange-400)',
          500: 'var(--color-orange-500)',
          600: 'var(--color-orange-600)',
          700: 'var(--color-orange-700)',
          800: 'var(--color-orange-800)',
          900: 'var(--color-orange-900)',
          950: 'var(--color-orange-950)',
        },

        // Purple colors
        purple: {
          50: 'var(--color-purple-50)',
          100: 'var(--color-purple-100)',
          200: 'var(--color-purple-200)',
          300: 'var(--color-purple-300)',
          400: 'var(--color-purple-400)',
          500: 'var(--color-purple-500)',
          600: 'var(--color-purple-600)',
          700: 'var(--color-purple-700)',
          800: 'var(--color-purple-800)',
          900: 'var(--color-purple-900)',
          950: 'var(--color-purple-950)',
        },

        // Pink colors
        pink: {
          50: 'var(--color-pink-50)',
          100: 'var(--color-pink-100)',
          200: 'var(--color-pink-200)',
          300: 'var(--color-pink-300)',
          400: 'var(--color-pink-400)',
          500: 'var(--color-pink-500)',
          600: 'var(--color-pink-600)',
          700: 'var(--color-pink-700)',
          800: 'var(--color-pink-800)',
          900: 'var(--color-pink-900)',
          950: 'var(--color-pink-950)',
        },

        // Gray-blue colors
        'gray-blue': {
          25: 'var(--color-gray-blue-25)',
          50: 'var(--color-gray-blue-50)',
          100: 'var(--color-gray-blue-100)',
          200: 'var(--color-gray-blue-200)',
          300: 'var(--color-gray-blue-300)',
          400: 'var(--color-gray-blue-400)',
          500: 'var(--color-gray-blue-500)',
          600: 'var(--color-gray-blue-600)',
          700: 'var(--color-gray-blue-700)',
          800: 'var(--color-gray-blue-800)',
          900: 'var(--color-gray-blue-900)',
          950: 'var(--color-gray-blue-950)',
        },

        // Utility colors (theme-aware)
        'utility-brand': {
          50: 'var(--color-utility-brand-50)',
          '50-alt': 'var(--color-utility-brand-50_alt)',
          100: 'var(--color-utility-brand-100)',
          '100-alt': 'var(--color-utility-brand-100_alt)',
          200: 'var(--color-utility-brand-200)',
          '200-alt': 'var(--color-utility-brand-200_alt)',
          300: 'var(--color-utility-brand-300)',
          '300-alt': 'var(--color-utility-brand-300_alt)',
          400: 'var(--color-utility-brand-400)',
          '400-alt': 'var(--color-utility-brand-400_alt)',
          500: 'var(--color-utility-brand-500)',
          '500-alt': 'var(--color-utility-brand-500_alt)',
          600: 'var(--color-utility-brand-600)',
          '600-alt': 'var(--color-utility-brand-600_alt)',
          700: 'var(--color-utility-brand-700)',
          '700-alt': 'var(--color-utility-brand-700_alt)',
          800: 'var(--color-utility-brand-800)',
          '800-alt': 'var(--color-utility-brand-800_alt)',
          900: 'var(--color-utility-brand-900)',
          '900-alt': 'var(--color-utility-brand-900_alt)',
        },

        'utility-gray': {
          50: 'var(--color-utility-gray-50)',
          100: 'var(--color-utility-gray-100)',
          200: 'var(--color-utility-gray-200)',
          300: 'var(--color-utility-gray-300)',
          400: 'var(--color-utility-gray-400)',
          500: 'var(--color-utility-gray-500)',
          600: 'var(--color-utility-gray-600)',
          700: 'var(--color-utility-gray-700)',
          800: 'var(--color-utility-gray-800)',
          900: 'var(--color-utility-gray-900)',
        },

        'utility-error': {
          50: 'var(--color-utility-error-50)',
          100: 'var(--color-utility-error-100)',
          200: 'var(--color-utility-error-200)',
          300: 'var(--color-utility-error-300)',
          400: 'var(--color-utility-error-400)',
          500: 'var(--color-utility-error-500)',
          600: 'var(--color-utility-error-600)',
          700: 'var(--color-utility-error-700)',
        },

        'utility-warning': {
          50: 'var(--color-utility-warning-50)',
          100: 'var(--color-utility-warning-100)',
          200: 'var(--color-utility-warning-200)',
          300: 'var(--color-utility-warning-300)',
          400: 'var(--color-utility-warning-400)',
          500: 'var(--color-utility-warning-500)',
          600: 'var(--color-utility-warning-600)',
          700: 'var(--color-utility-warning-700)',
        },

        'utility-success': {
          50: 'var(--color-utility-success-50)',
          100: 'var(--color-utility-success-100)',
          200: 'var(--color-utility-success-200)',
          300: 'var(--color-utility-success-300)',
          400: 'var(--color-utility-success-400)',
          500: 'var(--color-utility-success-500)',
          600: 'var(--color-utility-success-600)',
          700: 'var(--color-utility-success-700)',
        },

        'utility-gray-blue': {
          50: 'var(--color-utility-gray-blue-50)',
          100: 'var(--color-utility-gray-blue-100)',
          200: 'var(--color-utility-gray-blue-200)',
          300: 'var(--color-utility-gray-blue-300)',
          400: 'var(--color-utility-gray-blue-400)',
          500: 'var(--color-utility-gray-blue-500)',
          600: 'var(--color-utility-gray-blue-600)',
          700: 'var(--color-utility-gray-blue-700)',
        },



        // Semantic colors for UI components
        primary: 'var(--color-text-brand-primary)',
        secondary: 'var(--color-bg-secondary)',
        muted: 'var(--color-bg-secondary)',
        destructive: 'var(--color-text-error-primary)',
        card: 'var(--color-bg-primary)',
        foreground: 'var(--color-text-primary)',
        'muted-foreground': 'var(--color-text-primary)',
        border: 'var(--color-border-primary)',

        // Component-specific colors
        'app-store-badge-border': 'var(--color-app-store-badge-border)',
        'avatar-bg': 'var(--color-avatar-bg)',
        'avatar-contrast-border': 'var(--color-avatar-contrast-border)',
        'avatar-profile-photo-border': 'var(--color-avatar-profile-photo-border)',
        'avatar-styles-bg-neutral': 'var(--color-avatar-styles-bg-neutral)',
        'button-destructive-primary-icon': 'var(--color-button-destructive-primary-icon)',
        'button-destructive-primary-icon-hover': 'var(--color-button-destructive-primary-icon_hover)',
        'button-primary-icon': 'var(--color-button-primary-icon)',
        'button-primary-icon-hover': 'var(--color-button-primary-icon_hover)',
        'featured-icon-light-fg-brand': 'var(--color-featured-icon-light-fg-brand)',
        'featured-icon-light-fg-error': 'var(--color-featured-icon-light-fg-error)',
        'featured-icon-light-fg-gray': 'var(--color-featured-icon-light-fg-gray)',
        'featured-icon-light-fg-success': 'var(--color-featured-icon-light-fg-success)',
        'featured-icon-light-fg-warning': 'var(--color-featured-icon-light-fg-warning)',
        'focus-ring': 'var(--color-focus-ring)',
        'focus-ring-error': 'var(--color-focus-ring-error)',
        'footer-button-fg': 'var(--color-footer-button-fg)',
        'footer-button-fg-hover': 'var(--color-footer-button-fg_hover)',
        'icon-fg-brand': 'var(--color-icon-fg-brand)',
        'icon-fg-brand-on-brand': 'var(--color-icon-fg-brand_on-brand)',
        'screen-mockup-border': 'var(--color-screen-mockup-border)',
        'slider-handle-bg': 'var(--color-slider-handle-bg)',
        'slider-handle-border': 'var(--color-slider-handle-border)',
        'toggle-border': 'var(--color-toggle-border)',
        'toggle-button-fg-disabled': 'var(--color-toggle-button-fg_disabled)',
        'toggle-slim-border-pressed': 'var(--color-toggle-slim-border_pressed)',
        'toggle-slim-border-pressed-hover': 'var(--color-toggle-slim-border_pressed-hover)',
        'tooltip-supporting-text': 'var(--color-tooltip-supporting-text)',
      },

      // Ring colors using variables
      ringColor: {
        primary: 'var(--ring-color-primary)',
        secondary: 'var(--ring-color-secondary)',
        'secondary-alt': 'var(--ring-color-secondary_alt)',
        tertiary: 'var(--ring-color-tertiary)',
        disabled: 'var(--ring-color-disabled)',
        'disabled-subtle': 'var(--ring-color-disabled_subtle)',
        brand: 'var(--ring-color-brand)',
        'brand-alt': 'var(--ring-color-brand_alt)',
        'brand-solid': 'var(--ring-color-brand-solid)',
        'brand-solid-hover': 'var(--ring-color-brand-solid_hover)',
        'bg-brand-solid': 'var(--ring-color-bg-brand-solid)',
        error: 'var(--ring-color-error)',
        'error-subtle': 'var(--ring-color-error_subtle)',
      },

      // Outline colors using variables
      outlineColor: {
        primary: 'var(--outline-color-primary)',
        secondary: 'var(--outline-color-secondary)',
        'secondary-alt': 'var(--outline-color-secondary_alt)',
        tertiary: 'var(--outline-color-tertiary)',
        disabled: 'var(--outline-color-disabled)',
        'disabled-subtle': 'var(--outline-color-disabled_subtle)',
        brand: 'var(--outline-color-brand)',
        'brand-alt': 'var(--outline-color-brand_alt)',
        'brand-solid': 'var(--outline-color-brand-solid)',
        'brand-solid-hover': 'var(--outline-color-brand-solid_hover)',
        error: 'var(--outline-color-error)',
        'error-subtle': 'var(--outline-color-error_subtle)',
      },
    },
  },
  plugins: [],
}