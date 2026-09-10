import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// RTL auto-cleanup não roda com globals:false do vitest — registrar manualmente
afterEach(cleanup)
