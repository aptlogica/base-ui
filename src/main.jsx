/*
Copyright (c) 2026 Aptlogica Technologies Private Limited
This file is part of software developed by Aptlogica Technologies Private Limited.
Licensed under the MIT License. See the LICENSE file in the project root
for full license information.
Websites:
https://www.aptlogica.com
https://www.serenibase.com
Support:
support@aptlogica.com
support@serenibase.com
*/

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.js'
import './styles/theme.css'
import './styles/common.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
